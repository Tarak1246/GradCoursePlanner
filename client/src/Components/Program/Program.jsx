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
  { header: "CRN", accessor: "name" },
  { header: "Level", accessor: "age" },
  { header: "Title", accessor: "email" },
  { header: "Semester", accessor: "email" },
  { header: "Year", accessor: "email" },
  { header: "Credits", accessor: "email" },
  { header: "Grade", accessor: "email" },
  { header: "", accessor: "age" },
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
        <p><strong>Name</strong>:  { localStorage.getItem("loginUser")}</p>
        <p><strong>Email</strong>:  {localStorage.getItem("loginUserEmail")}</p>
        <p><strong>Degree</strong>:  Master of Science</p>
        </div>
        <div className="divprogram">
       
        <p><strong>Level</strong>:  Graduate</p>
        <p><strong>Program</strong>:  Computer Science - MS</p>
        <p><strong>Status</strong>:  In Progess</p>
        </div>
        <div className="divscores">
        <p><strong>CEG Credits</strong>:  9</p>
        <p><strong>CS Credits</strong>:  12</p>
        <p><strong>Core Credits</strong>:  6</p>
       
        </div>
        <div className="divscores2">
        <p><strong>Lowlevel Credits</strong>:  9</p>
        <p><strong>Total Credits</strong>:  21</p>
        <p><strong>GPA</strong>: 3.98</p>
        </div>
      </div>
      <Table data={data} columns={columns} />
    </div>
  );
}

export default Program;
