// import { useState, useEffect } from "react";
// import axios from "axios";
// import Papa from "papaparse";
// import CsvPreview from "./CsvPreview";

// function IngestionForm() {
//   const [tables, setTables] = useState([]);
//   const [columns, setColumns] = useState([]);
//   const [selectedTable, setSelectedTable] = useState("");
//   const [selectedColumns, setSelectedColumns] = useState([]);
//   const [file, setFile] = useState(null);
//   const [inputPreview, setInputPreview] = useState([]);
//   const [outputPreview, setOutputPreview] = useState([]);
//   const [status, setStatus] = useState("");

//   useEffect(() => {
//     const fetchTables = async () => {
//       try {
//         const response = await axios.get("http://localhost:8080/api/tables");
//         setTables(response.data.tables);
//       } catch (error) {
//         setStatus(`Error fetching tables: ${error.message}`);
//       }
//     };
//     fetchTables();
//   }, []);

//   const handleTableChange = async (e) => {
//     const table = e.target.value;
//     setSelectedTable(table);
//     setSelectedColumns([]);
//     try {
//       const response = await axios.post("http://localhost:8080/api/columns", {
//         table,
//       });
//       setColumns(response.data.columns);
//     } catch (error) {
//       setStatus(`Error fetching columns: ${error.message}`);
//     }
//   };

//   const handleColumnToggle = (column) => {
//     setSelectedColumns((prev) =>
//       prev.includes(column)
//         ? prev.filter((c) => c !== column)
//         : [...prev, column]
//     );
//   };

//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files[0];
//     setFile(selectedFile);
//     if (selectedFile) {
//       Papa.parse(selectedFile, {
//         complete: (result) => {
//           setInputPreview(result.data);
//         },
//         header: false,
//         skipEmptyLines: true,
//       });
//     } else {
//       setInputPreview([]);
//     }
//   };

//   const handleUpload = async () => {
//     if (!file || !selectedTable || selectedColumns.length === 0) {
//       setStatus("Please select table, columns, and file.");
//       return;
//     }
//     setStatus("Uploading...");
//     const formData = new FormData();
//     formData.append("table", selectedTable);
//     formData.append("columns", JSON.stringify(selectedColumns));
//     formData.append("delimiter", ",");
//     formData.append("file", file);

//     try {
//       const response = await axios.post(
//         "http://localhost:8080/api/ingest/ff-to-ch-upload",
//         formData
//       );
//       setStatus(`Upload complete: ${response.data.record_count} records`);
//     } catch (error) {
//       setStatus(`Error uploading: ${error.message}`);
//     }
//   };

//   const handleDownload = async () => {
//     if (!selectedTable || selectedColumns.length === 0) {
//       setStatus("Please select table and columns.");
//       return;
//     }
//     setStatus("Downloading...");
//     const formData = {
//       table: selectedTable,
//       columns: selectedColumns,
//     };
//     try {
//       const response = await axios.post(
//         "http://localhost:8080/api/ingest/ch-to-ff-preview",
//         formData
//       );
//       if (response.data.csv_content) {
//         const parsed = Papa.parse(response.data.csv_content, {
//           header: false,
//         }).data;
//         setOutputPreview(parsed);
//         setStatus(
//           `Download preview ready: ${response.data.record_count} records`
//         );
//       } else {
//         setStatus(`Error: ${response.data.error}`);
//       }
//     } catch (error) {
//       setStatus(`Error downloading: ${error.message}`);
//     }
//   };

//   return (
//     <div>
//       <h2>Data Ingestion</h2>
//       <div>
//         <label>Select Table:</label>
//         <select value={selectedTable} onChange={handleTableChange}>
//           <option value="">Select a table</option>
//           {tables.map((table) => (
//             <option key={table} value={table}>
//               {table}
//             </option>
//           ))}
//         </select>
//       </div>
//       <div>
//         <label>Columns:</label>
//         {columns.map((column) => (
//           <div key={column}>
//             <input
//               type="checkbox"
//               checked={selectedColumns.includes(column)}
//               onChange={() => handleColumnToggle(column)}
//             />
//             {column}
//           </div>
//         ))}
//       </div>
//       <div>
//         <label>Upload CSV:</label>
//         <input type="file" accept=".csv" onChange={handleFileChange} />
//         <button onClick={handleUpload}>Upload to ClickHouse</button>
//       </div>
//       <CsvPreview data={inputPreview} title="Input CSV Preview" />
//       <div>
//         <button onClick={handleDownload}>Preview Output from ClickHouse</button>
//       </div>
//       <CsvPreview data={outputPreview} title="Output CSV Preview" />
//       <p>{status}</p>
//     </div>
//   );
// }

// export default IngestionForm;
import { useState, useEffect } from "react";
import axios from "axios";
import Papa from "papaparse";
import CsvPreview from "./CsvPreview";
import DataTable from "./DataTable";

function IngestionForm() {
  const [tables, setTables] = useState([]);
  const [columns, setColumns] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [file, setFile] = useState(null);
  const [inputPreview, setInputPreview] = useState([]);
  const [outputPreview, setOutputPreview] = useState([]);
  const [tableData, setTableData] = useState({ headers: [], rows: [] });
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/tables");
        setTables(response.data.tables);
      } catch (error) {
        setStatus(`Error fetching tables: ${error.message}`);
      }
    };
    fetchTables();
  }, []);

  const handleTableChange = async (e) => {
    const table = e.target.value;
    setSelectedTable(table);
    setSelectedColumns([]);
    setTableData({ headers: [], rows: [] });
    try {
      // Fetch columns
      const columnsResponse = await axios.post(
        "http://localhost:8080/api/columns",
        { table }
      );
      setColumns(columnsResponse.data.columns);
      // Fetch table preview
      const previewResponse = await axios.post(
        "http://localhost:8080/api/preview",
        { table }
      );
      if (previewResponse.data.headers && previewResponse.data.rows) {
        setTableData({
          headers: previewResponse.data.headers,
          rows: previewResponse.data.rows,
        });
      } else {
        setStatus("No data available for preview.");
      }
    } catch (error) {
      setStatus(`Error fetching data: ${error.message}`);
    }
  };

  const handleColumnToggle = (column) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      Papa.parse(selectedFile, {
        complete: (result) => {
          setInputPreview(result.data);
        },
        header: false,
        skipEmptyLines: true,
      });
    } else {
      setInputPreview([]);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedTable || selectedColumns.length === 0) {
      setStatus("Please select table, columns, and file.");
      return;
    }
    setStatus("Uploading...");
    const formData = new FormData();
    formData.append("table", selectedTable);
    formData.append("columns", JSON.stringify(selectedColumns));
    formData.append("delimiter", ",");
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:8080/api/ingest/ff-to-ch-upload",
        formData
      );
      setStatus(`Upload complete: ${response.data.record_count} records`);
      // Refresh table preview after upload
      const previewResponse = await axios.post(
        "http://localhost:8080/api/preview",
        { table: selectedTable }
      );
      if (previewResponse.data.headers && previewResponse.data.rows) {
        setTableData({
          headers: previewResponse.data.headers,
          rows: previewResponse.data.rows,
        });
      }
    } catch (error) {
      setStatus(`Error uploading: ${error.message}`);
    }
  };

  const handleDownload = async () => {
    if (!selectedTable || selectedColumns.length === 0) {
      setStatus("Please select table and columns.");
      return;
    }
    setStatus("Downloading...");
    const formData = {
      table: selectedTable,
      columns: selectedColumns,
      filename: "C:\\test\\output.csv",
      delimiter: ",",
    };
    try {
      const response = await axios.post(
        "http://localhost:8080/api/ingest/ch-to-ff",
        formData
      );
      setStatus(`Download complete: ${response.data.record_count} records`);
      const parsed = Papa.parse(
        `${selectedColumns.join(",")}\n${
          response.data.record_count > 0
            ? response.data.rows
                .map((row) => selectedColumns.map((col) => row[col]).join(","))
                .join("\n")
            : ""
        }`,
        { header: false }
      ).data;
      setOutputPreview(parsed);
    } catch (error) {
      setStatus(`Error downloading: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>Data Ingestion</h2>
      <div>
        <label>Select Table:</label>
        <select value={selectedTable} onChange={handleTableChange}>
          <option value="">Select a table</option>
          {tables.map((table) => (
            <option key={table} value={table}>
              {table}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Columns:</label>
        {columns.map((column) => (
          <div key={column}>
            <input
              type="checkbox"
              checked={selectedColumns.includes(column)}
              onChange={() => handleColumnToggle(column)}
            />
            {column}
          </div>
        ))}
      </div>
      <DataTable
        headers={tableData.headers}
        rows={tableData.rows}
        title="ClickHouse Table Preview"
      />
      <div>
        <label>Upload CSV:</label>
        <input type="file" accept=".csv" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload to ClickHouse</button>
      </div>
      <CsvPreview data={inputPreview} title="Input CSV Preview" />
      <div>
        <button onClick={handleDownload}>Download from ClickHouse</button>
      </div>
      <CsvPreview data={outputPreview} title="Output CSV Preview" />
      <p>{status}</p>
    </div>
  );
}

export default IngestionForm;
