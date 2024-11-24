import React from "react";
import './Program.css';

const Table = ({ data, columns }) => {
  return (
    <div className='tablediv' style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.accessor}
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                  backgroundColor: "#f4f4f4",
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col) => (
                <td
                  key={col.accessor}
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                  }}
                >
                  {row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Usage
const columns = [
  { header: "Title", accessor: "name" },
  { header: "Status", accessor: "age" },
  { header: "Semester", accessor: "email" },
  { header: "Year", accessor: "email" },
  { header: "Credits", accessor: "email" },
  { header: "Days", accessor: "email" },
  { header: "", accessor: "email" },
];

const data = [
  { name: "John Doe", age: 28, email: "john@example.com" },
  { name: "Jane Smith", age: 34, email: "jane@example.com" },
];

function Program() {
  return (
    <div>
      <h1 className="headtxt">Program of study</h1>
      <div className="divprofile">
        <div className="divname">
        <p>Name:{ localStorage.getItem("loginUser")}</p>
        <p>Email:{localStorage.getItem("loginUserEmail")}</p>
        </div>
        <div className="divprogram">
        <p>Degree: Master of Science</p>
        <p>Level: Graduate</p>
        <p>Program: Computer Science - MS</p>
        </div>
      </div>
      <Table data={data} columns={columns} />
    </div>
  );
}

export default Program;
