import React from "react";

function DataTable({ headers, rows, title }) {
  if (!headers || headers.length === 0 || !rows || rows.length === 0) {
    return <p>No data to display.</p>;
  }

  return (
    <div style={{ margin: "20px 0" }}>
      <h3>{title}</h3>
      <table
        style={{ borderCollapse: "collapse", width: "100%", marginTop: "10px" }}
      >
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  backgroundColor: "#f2f2f2",
                  textAlign: "left",
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((header, colIndex) => (
                <td
                  key={colIndex}
                  style={{ border: "1px solid #ddd", padding: "8px" }}
                >
                  {row[header] || ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
