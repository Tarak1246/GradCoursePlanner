import React, { useState, useEffect } from "react";
import "./Program.css";
import { programData } from "../../api/baseApiUrl";

const Table = ({ data, columns, onEdit }) => {
  return (
    <div className="tablediv" style={{ overflowX: "auto" }}>
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
            <th>
              Action
            </th>
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
               <td>
                <button onClick={() => onEdit(row)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Table Columns
const columns = [
  { header: "CRN", accessor: "crn" },
  { header: "Level", accessor: "level" },
  { header: "Title", accessor: "title" },
  { header: "Semester", accessor: "semester" },
  { header: "Credits", accessor: "credits" },
  { header: "Status", accessor: "status" },
  { header: "Grade", accessor: "grade" },
];

function Program() {
  const [rawData, setRawData] = useState([]);
const [data, setData] = useState([]);
  const [programStatus, setProgramStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [cegCredits, setCegCredits] = useState(0);
  const [csCredits, setCsCredits]= useState(0);
  const [coreCredits, setCoreCredits] = useState(0);
  const [gpa, setGpa] = useState(0);
  const [lowerLevelCredits, setLowerLevelCredits] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  // Fetch program data

   
  const [editRow, setEditRow] = useState(null);
  const [updatedField, setUpdatedField] = useState("");

  const getProgramdata = async () => {
    try {
      console.warn("Fetching program data...");
      const userProgramData = await programData();

      console.log(userProgramData);
      if (userProgramData?.status === "success") {
        setRawData(userProgramData.data.courses);
        setProgramStatus(userProgramData.data.completionStatus);
        setCegCredits(userProgramData.data.cegCredits);
        setCoreCredits(userProgramData.data.coreCredits);
        setCsCredits(userProgramData.data.csCredits);
        setGpa(userProgramData.data.gpa);
        setLowerLevelCredits(userProgramData.data.lowerLevelCredits);
        setTotalCredits(userProgramData.data.totalCredits);
      } else {
        console.error("Failed to fetch program data.");
      }
    } catch (error) {
      console.error("Error fetching program data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Call API once when component mounts
  useEffect(() => {
    getProgramdata();
  }, []);

  // Map data for the table
  useEffect(() => {
    const mappedData = rawData.map((item) => ({
      crn: item.crn,
      level: `${item.subject} ${item.course}`,
      title: item.title,
      semester: `${item.semesterTaken} ${item.yearTaken}`,
      credits: item.credits,
      status: item.status,
      grade: item.grade,
    }));
    setData(mappedData);
  }, [rawData]); // Dependency on rawData

  if (loading) {
    return <div>Loading...</div>;
  }
  

  const handleEdit = (row) => {
    setEditRow(row);  // Store the row to be edited
    setUpdatedField(row.grade);  // Initialize the input with the field value
  };

  const handleSave = () => {
    const updatedData = data.map((row) =>
      row.crn === editRow.crn ? { ...row, grade: updatedField } : row
    );
    setData(updatedData); // Update the `data` state

    // Update `rawData` to maintain consistency
    const updatedRawData = rawData.map((item) =>
      item.crn === editRow.crn ? { ...item, grade: updatedField } : item
    );
    setRawData(updatedRawData);
  
    setEditRow(null); // Close the modal after saving
  };

  const handleClose = () => {
    setEditRow(null);  // Close the modal without saving
  };


  return (
    <div>
      <h1 className="headtxt">Program of Study</h1>
      <div className="divprofile">
        <div className="divname">
          <p><strong>Name</strong>: {localStorage.getItem("loginUser")}</p>
          <p><strong>Email</strong>: {localStorage.getItem("loginUserEmail")}</p>
          <p><strong>Degree</strong>: Master of Science</p>
        </div>
        <div className="divprogram">
          <p><strong>Level</strong>: Graduate</p>
          <p><strong>Program</strong>: Computer Science - MS</p>
          <p><strong>Status</strong>: {programStatus}</p>
        </div>
        <div className="divscores">
          <p><strong>CEG Credits</strong>:&nbsp;
          <span style={{ color: cegCredits > 12 ? "red" : "inherit" }}>
          {cegCredits}
          </span> &nbsp;&nbsp;&nbsp; 
          <strong>Max</strong>:&nbsp;12</p>
          <p><strong>CS Credits</strong>:&nbsp;{csCredits}</p>
          <p><strong>Core Credits</strong>:&nbsp;  
          <span style={{ color: coreCredits < 6 ? "red" : "inherit" }}>
          {coreCredits}   
          </span>
          &nbsp;&nbsp;&nbsp;
          <strong>Min</strong>:&nbsp;6</p>
        </div>
        <div className="divscores2">
          <p><strong>Lowlevel Credits</strong>:&nbsp;
          <span style={{ color: lowerLevelCredits > 12 ? "red" : "inherit" }}>
          {lowerLevelCredits}   
          </span>&nbsp;&nbsp;&nbsp;<strong>Max</strong>: 12</p>
          <p><strong>Total Credits</strong>:&nbsp;
          <span style={{ color: totalCredits < 30 ? "red" : "green" }}>
          {totalCredits}  
          </span> &nbsp;&nbsp;&nbsp;<strong>Min</strong>: 30</p>
          <p><strong>GPA</strong>:&nbsp;{gpa}/4</p>
        </div>
      </div>
      <Table data={data} columns={columns} onEdit={handleEdit} />
      
      {editRow && (
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-content">
            <div className="modal-headerdiv">
            <p className="model-headtxt">Upadate your Grade</p>
            </div>
            <div className="modal-bodydiv">
            <div className="modal-text1">
            <p><strong>Title:</strong> {editRow.title}</p>
            <p><strong>Semester:</strong> {editRow.semester}</p>
            </div>
            <div className="modal-text2">
            <p><strong>CRN:</strong> {editRow.crn}</p>
            <p><strong>Level:</strong> {editRow.level}</p>
            <p><strong>Credits:</strong> {editRow.credits}</p>
            </div>
            </div>
            <div className="modal-editdiv">
            <p><strong>Grade:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <select 
                value={updatedField} 
                onChange={(e) => setUpdatedField(e.target.value)}
              >
                <option value=""></option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="F">F</option>
              </select>
            </p>
            </div>
            <div>
              <p><strong>Feedback:</strong></p>
              <input type="text" className="feedbacktext"/>
              </div>
            <div className="modal-buttondiv">
            <button className="model-button" onClick={handleSave}>Save</button>
            <button className="model-button" onClick={handleClose}>Close</button>
            
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Program;
