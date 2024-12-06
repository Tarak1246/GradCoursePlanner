import React, { useState, useEffect, useRef } from "react";
import "./Program.css";
import {
  deleteCourse,
  programData,
  updateCourseGrade,
} from "../../api/baseApiUrl";
import { FaEdit, FaTrash } from "react-icons/fa";

const Table = ({ data, columns, onEdit, onDelete }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Function to sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Function to handle sorting
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="tablediv" style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.accessor}
                onClick={() => handleSort(col.accessor)}
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                  backgroundColor: "#f4f4f4",
                  cursor: "pointer",
                }}>
                {col.header}
                {sortConfig.key === col.accessor && (
                  <span style={{ marginLeft: "8px" }}>
                    {sortConfig.direction === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
            ))}
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col) => (
                <td
                  key={col.accessor}
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                  }}>
                  {row[col.accessor]}
                </td>
              ))}
              <td className="action-cell">
                {/* Edit Button with Icon */}
                <button
                  onClick={() => onEdit(row)}
                  className="action-button edit-button bg-green-800">
                  <FaEdit className="icon" />
                </button>

                {/* Delete Button with Icon */}
                {row.status !== "Completed" && (
                  <button
                    onClick={() => onDelete(row)}
                    className="action-button delete-button">
                    <FaTrash className="icon" />
                  </button>
                )}
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
  const [csCredits, setCsCredits] = useState(0);
  const [coreCredits, setCoreCredits] = useState(0);
  const [prequisitesCredits, setPreqcredits] = useState(0);
  const [gpa, setGpa] = useState(0);
  const [lowerLevelCredits, setLowerLevelCredits] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [marks, setMarks] = useState(0);
  const [feedback, setFeedback] = useState("");
  const feedbackRef = useRef();
  // Fetch program data

  const [editRow, setEditRow] = useState(null);
  const [updatedField, setUpdatedField] = useState("");
  const [deleteRow, setDeleteRow] = useState(null);

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
        setPreqcredits(userProgramData.data.defaultPrequisites);
      } else {
        console.error("Failed to fetch program data.");
      }
    } catch (error) {
      console.error("Error fetching program data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateGrade = async (courseData) => {
    try {
      console.warn("updating program data...");
      const response = await updateCourseGrade(courseData);
      if (response.status === 200 && (response.data.statusCode === 200 || response.data.statusCode === 500)) {
        setGpa(response.data.gpa);
        console.log(response);
      } else {
        console.log(response);
        alert(response.data.message+" Failed to update the course grade. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching program data:", error);
    }
  };
  // Call API once when component mounts
  useEffect(() => {
    getProgramdata();
  }, []);

  // Map data for the table
  useEffect(() => {
    // Check if rawData is an array and has data
    if (Array.isArray(rawData) && rawData.length > 0) {
      try {
        const mappedData = rawData.map((item) => ({
          crn: item.crn,
          level: `${item.subject} ${item.course}`,
          title: item.title,
          semester: `${item.semesterTaken} ${item.yearTaken}`,
          credits: item.credits,
          status: item.status,
          grade: item.grade,
          marks: item.marks,
          feedback: item.feedback,
        }));

        // Set the data with the mapped data
        setData(mappedData);
      } catch (error) {
        console.error("Error mapping rawData:", error);
      }
    } else {
      console.warn("rawData is either empty or not an array");
      // Handle the case where rawData is empty or undefined
    }
  }, [rawData]); // Dependency on rawData

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleDelete = (row) => {
    setDeleteRow(row);
  };

  const handleEdit = (row) => {
    setEditRow(row); // Store the row to be edited
    setUpdatedField(row.grade); // Initialize the input with the field value
    setFeedback(row.feedback);
    setMarks(row.marks);
    
  };

  const handleSave = async () => {
    // Get the feedback text from the input
    const feedbackText = feedbackRef.current.value;
    const updatedData = data.map((row) =>
      row.crn === editRow.crn ? { ...row, grade: updatedField } : row
    );
    setData(updatedData); // Update the `data` state

    // Update `rawData` to maintain consistency
    const updatedRawData = rawData.map((item) =>
      item.crn === editRow.crn
        ? { ...item, grade: updatedField, marks: marks,feedback: feedbackText, status: "Completed" }
        : item
    );
    setRawData(updatedRawData);
    // Extract the updated row
    const updatedRow = updatedRawData.find((item) => item.crn === editRow.crn);

    // Format the data to match `courseData` structure
    const courseData = {
      courseId: updatedRow.courseId,
      title: updatedRow.title,
      grade: updatedRow.grade,
      marks: updatedRow.marks,
      totalMarks: 100,
      course: updatedRow.course,
      feedback: feedbackText, // Include feedback text
      subject: updatedRow.subject,
    };

    try {
      // Call `updateGrade` with formatted data
      await updateGrade(courseData);
      getProgramdata();
    } catch (error) {
      console.error("Error updating grade:", error);
    }

    setEditRow(null); // Close the modal after saving
  };

  const handleDeleteSave = async () => {
    try {
      // Find the row to delete
      const rowToDelete = rawData.find((item) => item.crn === deleteRow.crn);

      if (!rowToDelete) {
        console.error("Row not found for deletion");
        return;
      }

      // Call the backend API to delete the course
      const response = await deleteCourse(rowToDelete.courseId);
      console.log(response);
      if (response.status === 200 && response.data.statusCode === 200) {
        const updatedData = data.filter((row) => row.crn !== deleteRow.crn);
        const updatedRawData = rawData.filter(
          (item) => item.crn !== deleteRow.crn
        );

        // Update state with the remaining rows
        getProgramdata();
        setData(updatedData);
        setRawData(updatedRawData);
      } else {
        alert(response.data.message+" Failed to drop the course. Please try again.");
        console.warn(response);
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Failed to delete the course. Please try again.");
    } finally {
      setDeleteRow(null); // Close the modal after saving
    }
  };

  const handleClose = () => {
    setEditRow(null); // Close the modal without saving
    setDeleteRow(null);
  };

  return (
    <div>
      <h1 className="headtxt">Program of Study</h1>
      <div className="divprofile">
        <div className="divname">
          <p>
            <strong>Name</strong>: {localStorage.getItem("loginUser")}
          </p>
          <p>
            <strong>Email</strong>: {localStorage.getItem("loginUserEmail")}
          </p>
          <p>
            <strong>Degree</strong>: Master of Science
          </p>
        </div>
        <div className="divprogram">
          <p>
            <strong>Level</strong>: Graduate
          </p>
          <p>
            <strong>Program</strong>: Computer Science - MS
          </p>
          <p>
            <strong>Status</strong>: {programStatus}
          </p>
        </div>
        <div className="divscores">
          <p>
            <strong>Prequisite Credits</strong>:&nbsp;{prequisitesCredits}
          </p>
          <p>
            <strong>CEG Credits</strong>:&nbsp;
            <span style={{ color: cegCredits > 12 ? "red" : "inherit" }}>
              {cegCredits}
            </span>{" "}
            &nbsp;&nbsp;&nbsp;
            <strong>Max</strong>:&nbsp;12
          </p>
          <p>
            <strong>CS Credits</strong>:&nbsp;{csCredits}
          </p>
          <p>
            <strong>Core Credits</strong>:&nbsp;
            <span style={{ color: coreCredits < 6 ? "red" : "inherit" }}>
              {coreCredits}
            </span>
            &nbsp;&nbsp;&nbsp;
            <strong>Min</strong>:&nbsp;6
          </p>
        </div>
        <div className="divscores2">
          <p>
            <strong>Lowlevel Credits</strong>:&nbsp;
            <span style={{ color: lowerLevelCredits > 12 ? "red" : "inherit" }}>
              {lowerLevelCredits}
            </span>
            &nbsp;&nbsp;&nbsp;<strong>Max</strong>: 12
          </p>
          <p>
            <strong>Total Credits</strong>:&nbsp;
            <span style={{ color: totalCredits < 30 ? "red" : "green" }}>
              {totalCredits}
            </span>{" "}
            &nbsp;&nbsp;&nbsp;<strong>Min</strong>: 30
          </p>
          <p>
            <strong>GPA</strong>:&nbsp;{gpa}/4
          </p>
        </div>
      </div>
      {rawData && Array.isArray(rawData) && rawData.length > 0 ? (
        <Table
          data={data}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <div className="tablediv" style={{textAlign:"center"}}>
          No data available. Please register the courses.
        </div>
      )}

      {editRow && (
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-content">
            <div className="modal-headerdiv">
              <p className="model-headtxt">Update your Grade</p>
              <div>
                <button className="modal-close-btn" onClick={handleClose}>
                  ×
                </button>
              </div>
            </div>
            <div className="modal-bodydiv">
              <div className="modal-text1">
                <p>
                  <strong>Title:</strong> {editRow.title}
                </p>
                <p>
                  <strong>Semester:</strong> {editRow.semester}
                </p>
              </div>
              <div className="modal-text2">
                <p>
                  <strong>CRN:</strong> {editRow.crn}
                </p>
                <p>
                  <strong>Level:</strong> {editRow.level}
                </p>
                <p>
                  <strong>Credits:</strong> {editRow.credits}
                </p>
              </div>
            </div>
            <div className="modal-editdiv">
              <p>
                <strong>Grade:</strong> &nbsp;&nbsp;&nbsp;
                <select
                  value={updatedField}
                  onChange={(e) => setUpdatedField(e.target.value)}>
                  <option value=""></option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="F">F</option>
                </select>
              </p>
              <p className="pinputmarks">
                <strong>Marks:</strong>&nbsp;&nbsp;&nbsp;
                <input
                  className="inputmarks"
                  type="number"
                  value={marks}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (value >= 0 && value <= 100) {
                      setMarks(value); // Update marks state if value is valid
                    } else if (e.target.value === "") {
                      setMarks(""); // Allow clearing the input
                    }
                  }}
                  placeholder="Enter marks (0-100)"
                />
              </p>
            </div>
            <div>
              <p>
                <strong>Feedback:</strong>
              </p>
              <input
                  type="text"
                  className="feedbacktext"
                  value={feedback}
                  onChange={(e) => {
                   setFeedback(e.target.value);
                  }}
                  placeholder="Enter feedback (max 250 words)"
                  ref={feedbackRef}
                />
               

              {/* <input type="text" className="feedbacktext" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Enter feedback" ref={feedbackRef} /> */}
            </div>
            <div className="modal-buttondiv">
              <button
                className="model-button bg-green-800"
                onClick={handleSave}>
                Save
              </button>
              <button
                className="model-button bg-green-800"
                onClick={handleClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteRow && (
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-deletecontent">
            <div className="modal-headerdiv">
              <p className="model-deleteheadtxt">
                Are you sure you want to drop this course
              </p>
              <div>
                <button className="modal-close-btn" onClick={handleClose}>
                  ×
                </button>
              </div>
            </div>
            <div className="modal-bodydiv">
              <div className="modal-text1">
                <p>
                  <strong>Title:</strong> {deleteRow.title}
                </p>
                <p>
                  <strong>Semester:</strong> {deleteRow.semester}
                </p>
              </div>
              <div className="modal-text2">
                <p>
                  <strong>CRN:</strong> {deleteRow.crn}
                </p>
                <p>
                  <strong>Level:</strong> {deleteRow.level}
                </p>
                <p>
                  <strong>Credits:</strong> {deleteRow.credits}
                </p>
              </div>
            </div>
            <div className="modal-buttondiv">
              <button className="model-button bg-green-800" onClick={handleDeleteSave}>
                Delete
              </button>
              <button className="model-button bg-green-800" onClick={handleClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Program;
