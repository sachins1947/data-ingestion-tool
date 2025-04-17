package backend.demo.Controller;

import org.springframework.http.MediaType;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.CSVReader;
import com.opencsv.CSVWriter;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import ru.yandex.clickhouse.ClickHouseConnection;
import ru.yandex.clickhouse.ClickHouseDataSource;
import ru.yandex.clickhouse.settings.ClickHouseProperties;

import java.io.FileReader;
import java.io.FileWriter;
import java.io.InputStreamReader;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class IngestionController {

    private ClickHouseConnection chConnection;

    private List<String> getStringList(Object obj) {
        if (obj instanceof List) {
            List<?> rawList = (List<?>) obj;
            List<String> result = new ArrayList<>();
            for (Object item : rawList) {
                if (item instanceof String) {
                    result.add((String) item);
                }
            }
            return result;
        }
        return new ArrayList<>();
    }

    @PostMapping("/connect")
    public Map<String, String> connectClickHouse(@RequestBody Map<String, String> config) {
        try {
            ClickHouseProperties properties = new ClickHouseProperties();
            properties.setUser(config.get("user"));
            properties.setPassword(config.get("jwt"));
            ClickHouseDataSource dataSource = new ClickHouseDataSource(
                "jdbc:clickhouse://" + config.get("host") + ":" + config.get("port"), properties);
            chConnection = dataSource.getConnection();
            chConnection.createStatement().execute("SELECT 1");
            return Map.of("status", "Connected");
        } catch (Exception e) {
            return Map.of("error", e.getMessage());
        }
    }

    @GetMapping("/tables")
    public Map<String, Object> getTables() {
        try {
            if (chConnection == null) {
                return Map.of("error", "Not connected to ClickHouse. Please call /api/connect first.");
            }
            Statement stmt = chConnection.createStatement();
            ResultSet rs = stmt.executeQuery("SHOW TABLES");
            List<String> tables = new ArrayList<>();
            while (rs.next()) {
                tables.add(rs.getString(1));
            }
            return Map.of("tables", tables);
        } catch (Exception e) {
            return Map.of("error", e.getMessage());
        }
    }

    @PostMapping("/columns")
    public Map<String, Object> getColumns(@RequestBody Map<String, String> body) {
        try {
            Statement stmt = chConnection.createStatement();
            ResultSet rs = stmt.executeQuery("DESCRIBE TABLE " + body.get("table"));
            List<String> columns = new ArrayList<>();
            while (rs.next()) {
                columns.add(rs.getString("name"));
            }
            return Map.of("columns", columns);
        } catch (Exception e) {
            return Map.of("error", e.getMessage());
        }
    }

    // @PostMapping("/ingest/ch-to-ff")
    // public Map<String, Object> ingestChToFf(@RequestBody Map<String, Object> body) {
    //     try {
    //         String table = (String) body.get("table");
    //         List<String> columns = getStringList(body.get("columns"));
    //         String filename = (String) body.get("filename");
    //         String delimiter = (String) body.get("delimiter");

    //         Statement stmt = chConnection.createStatement();
    //         ResultSet rs = stmt.executeQuery("SELECT " + String.join(", ", columns) + " FROM " + table);

    //         try (CSVWriter writer = new CSVWriter(new FileWriter(filename), delimiter.charAt(0),
    //                                              CSVWriter.DEFAULT_QUOTE_CHARACTER,
    //                                              CSVWriter.DEFAULT_ESCAPE_CHARACTER,
    //                                              CSVWriter.DEFAULT_LINE_END)) {
    //             writer.writeNext(columns.toArray(new String[0]));
    //             int count = 0;
    //             while (rs.next()) {
    //                 String[] row = new String[columns.size()];
    //                 for (int i = 0; i < columns.size(); i++) {
    //                     row[i] = rs.getString(i + 1);
    //                 }
    //                 writer.writeNext(row);
    //                 count++;
    //             }
    //             return Map.of("status", "Completed", "record_count", count);
    //         }
    //     } catch (Exception e) {
    //         return Map.of("error", e.getMessage());
    //     }
    // }
    @PostMapping("/ingest/ch-to-ff")
public Map<String, Object> ingestChToFf(@RequestBody Map<String, Object> body) {
    try {
        if (chConnection == null) {
            return Map.of("error", "Not connected to ClickHouse.");
        }
        String table = (String) body.get("table");
        List<String> columns = getStringList(body.get("columns"));
        String filename = (String) body.get("filename");
        String delimiter = (String) body.get("delimiter");

        Statement stmt = chConnection.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT " + String.join(", ", columns) + " FROM " + table);

        List<Map<String, Object>> rows = new ArrayList<>();
        try (CSVWriter writer = new CSVWriter(new FileWriter(filename), delimiter.charAt(0),
                                             CSVWriter.DEFAULT_QUOTE_CHARACTER,
                                             CSVWriter.DEFAULT_ESCAPE_CHARACTER,
                                             CSVWriter.DEFAULT_LINE_END)) {
            writer.writeNext(columns.toArray(new String[0]));
            int count = 0;
            while (rs.next()) {
                String[] row = new String[columns.size()];
                Map<String, Object> rowMap = new LinkedHashMap<>();
                for (int i = 0; i < columns.size(); i++) {
                    String value = rs.getString(i + 1);
                    row[i] = value;
                    rowMap.put(columns.get(i), value);
                }
                writer.writeNext(row);
                rows.add(rowMap);
                count++;
            }
            return Map.of(
                "status", "Completed",
                "record_count", count,
                "rows", rows
            );
        }
    } catch (Exception e) {
        return Map.of("error", e.getMessage());
    }
}

    @PostMapping("/ingest/ff-to-ch")
    public Map<String, Object> ingestFfToCh(@RequestBody Map<String, Object> body) {
        int count = 0; // Declare count outside try block
        try {
            String table = (String) body.get("table");
            List<String> columns = getStringList(body.get("columns"));
            String filename = (String) body.get("filename");
            String delimiter = (String) body.get("delimiter");

            try (CSVReader reader = new CSVReader(new FileReader(filename))) {
                String[] headers = reader.readNext();
                Map<String, Integer> colIndices = new HashMap<>();
                for (int i = 0; i < headers.length; i++) {
                    if (columns.contains(headers[i])) {
                        colIndices.put(headers[i], i);
                    }
                }

                Statement stmt = chConnection.createStatement();
                String[] row;
                while ((row = reader.readNext()) != null) {
                    List<String> values = new ArrayList<>();
                    for (String col : columns) {
                        values.add("'" + row[colIndices.get(col)].replace("'", "''") + "'");
                    }
                    stmt.execute("INSERT INTO " + table + " (" + String.join(", ", columns) + ") VALUES (" + String.join(", ", values) + ")");
                    count++;
                }
            }
            return Map.of("status", "Completed", "record_count", count);
        } catch (Exception e) {
            return Map.of("error", e.getMessage());
        }
    }
    @PostMapping(value = "/ingest/ff-to-ch-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public Map<String, Object> ingestFfToChUpload(
    @RequestParam("table") String table,
    @RequestParam("columns") String columnsJson,
    @RequestParam("delimiter") String delimiter,
    @RequestParam("file") MultipartFile file) {
    int count = 0;
    try {
        if (chConnection == null) {
            return Map.of("error", "Not connected to ClickHouse. Please call /api/connect first.");
        }
        List<String> columns = new ObjectMapper().readValue(columnsJson, new TypeReference<List<String>>(){});

        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            String[] headers = reader.readNext();
            Map<String, Integer> colIndices = new HashMap<>();
            for (int i = 0; i < headers.length; i++) {
                if (columns.contains(headers[i])) {
                    colIndices.put(headers[i], i);
                }
            }

            Statement stmt = chConnection.createStatement();
            String[] row;
            while ((row = reader.readNext()) != null) {
                List<String> values = new ArrayList<>();
                for (String col : columns) {
                    values.add("'" + row[colIndices.get(col)].replace("'", "''") + "'");
                }
                stmt.execute("INSERT INTO " + table + " (" + String.join(", ", columns) + ") VALUES (" + String.join(", ", values) + ")");
                count++;
            }
        }
        return Map.of("status", "Completed", "record_count", count);
    } catch (Exception e) {
        return Map.of("error", e.getMessage());
    }
}
@PostMapping("/ingest/ch-to-ff-preview")
public Map<String, Object> ingestChToFfPreview(@RequestBody Map<String, Object> body) {
    try {
        if (chConnection == null) {
            return Map.of("error", "Not connected to ClickHouse. Please call /api/connect first.");
        }
        String table = (String) body.get("table");
        List<String> columns = getStringList(body.get("columns"));

        Statement stmt = chConnection.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT " + String.join(", ", columns) + " FROM " + table);

        List<String> csvLines = new ArrayList<>();
        csvLines.add(String.join(",", columns)); // Headers
        int count = 0;
        while (rs.next()) {
            List<String> row = new ArrayList<>();
            for (int i = 0; i < columns.size(); i++) {
                row.add(rs.getString(i + 1));
            }
            csvLines.add(String.join(",", row));
            count++;
        }
        return Map.of(
            "status", "Completed",
            "record_count", count,
            "csv_content", String.join("\n", csvLines)
        );
    } catch (Exception e) {
        return Map.of("error", e.getMessage());
    }
}
  @PostMapping("/preview")
         public Map<String, Object> previewTable(@RequestBody Map<String, String> body) {
             try {
                 if (chConnection == null) {
                     return Map.of("error", "Not connected to ClickHouse. Please call /api/connect first.");
                 }
                 String table = body.get("table");
                 Statement stmt = chConnection.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT * FROM " + table + " LIMIT 10");
                 ResultSetMetaData metaData = rs.getMetaData();
                 int columnCount = metaData.getColumnCount();

                 List<String> headers = new ArrayList<>();
                 for (int i = 1; i <= columnCount; i++) {
                     headers.add(metaData.getColumnName(i));
                 }

                 List<Map<String, Object>> rows = new ArrayList<>();
                 while (rs.next()) {
                     Map<String, Object> row = new LinkedHashMap<>();
                     for (int i = 1; i <= columnCount; i++) {
                         row.put(headers.get(i - 1), rs.getObject(i));
                     }
                     rows.add(row);
                 }

                 return Map.of(
                     "headers", headers,
                     "rows", rows,
                     "record_count", rows.size()
                 );
             } catch (Exception e) {
                 return Map.of("error", e.getMessage());
             }
         }
}