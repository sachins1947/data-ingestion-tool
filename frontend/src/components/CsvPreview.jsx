import React from "react";

function CsvPreview({ data, title }) {
  if (!data || data.length === 0) {
    return <p>No data to preview.</p>;
  }

  const headers = data[0]; // First row as headers
  const rows = data.slice(1); // Rest as data rows

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
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  style={{ border: "1px solid #ddd", padding: "8px" }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CsvPreview;
