import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "../Alert/alert";
import axios from "axios";
import { handleCourseClick } from "../../api/baseApiUrl";
import ModalContent from "../../Modal/ModalContent";

const Subject = ({ courses, onBack, filters }) => {
  const [subjects] = useState(
    courses.map((course) => ({ id: course._id, title: course.title }))
  );

  const [subjectDetails, setSubjectDetails] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "default",
  });
  const [dialogs, setDialogs] = useState({
    delete: false,
    prereqConfirm: false,
    certificate: false,
    error: false,
  });

  const [dialogData, setDialogData] = useState({});
  const jwtToken = localStorage.getItem("jwtToken");

  const api = axios.create({
    baseURL: "http://localhost:4000/api",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`,
    },
  });

  const closeModal = () => {
    setShowDetailsDialog(false);
  };

  const showAlert = (message, type = "default") => {
    setAlert({ show: true, message, type });

    // Automatically hide the alert after 3 seconds
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "default" });
    }, 5000); // Adjust the timeout duration as needed
  };

  const toggleDialog = (dialog, isOpen, data = {}) =>
    setDialogs((prev) => ({ ...prev, [dialog]: isOpen })) ||
    setDialogData(data);

  const handleDragStart = (e, subject) => {
    e.dataTransfer.setData("subject", JSON.stringify(subject));
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const subject = JSON.parse(e.dataTransfer.getData("subject"));

    if (selectedSubjects?.some((s) => s.id === subject.id)) return;

    const eligibility = await checkSubjectEligibility(subject.id);
    if (eligibility === true) addSubject(subject);
  };

  const checkSubjectEligibility = async (subjectId) => {
    try {
      const response = await axios.get(
        `http://localhost:4000/api/subject-details/${subjectId}`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      const data = response.data;

      if (data.courseCheck && data.courseCheck.isValid === false) {
        toggleDialog("error", true, { message: data.courseCheck.message });
        return false;
      } else if (
        data.courseCheck &&
        data.courseCheck.isValid &&
        data.prerequisites &&
        data.prerequisites.eligible === false
      ) {
        toggleDialog("prereqConfirm", true, {
          message: `Have you completed these prerequisites: ${data.prerequisites.unmetPrerequisites.join(
            ", "
          )}?`,
          subject: subjects.find((s) => s.id === subjectId),
          certificates: data.certificateEligibility, // Include certificates data
        });
        return false;
      } else if (
        data.courseCheck &&
        data.courseCheck.isValid &&
        data.prerequisite &&
        data.prerequisites.eligible &&
        data.certificateEligibility &&
        data.certificateEligibility.length > 0
      ) {
        toggleDialog("certificate", true, {
          certificates: data.certificateEligibility,
        });
      }

      return true;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to verify subject eligibility. Please try again.";
      toggleDialog("error", true, { message: errorMessage });
      return false;
    }
  };

  const addSubject = (subject) =>
    setSelectedSubjects([...selectedSubjects, subject]);

  const handlePreReqConfirm = (confirmed) => {
    // Close the dialog
    toggleDialog("prereqConfirm", false);

    if (confirmed) {
      // Add the subject
      addSubject(dialogData.subject);

      // Check for certification eligibility after adding the subject
      if (dialogData.certificates?.length > 0) {
        toggleDialog("certificate", true, {
          certificates: dialogData.certificates,
        });
      }

      // Update dialogData to keep track of user response
      setDialogData((prev) => ({
        ...prev,
        userConfirmedPrerequisite: true, // User clicked Yes
      }));
    } else {
      // Update dialogData to track user rejected prerequisites
      setDialogData((prev) => ({
        ...prev,
        userConfirmedPrerequisite: false, // User clicked No
      }));
    }
  };

  const handleDeleteClick = (subject) =>
    toggleDialog("delete", true, { subject });

  const confirmDelete = () => {
    setSelectedSubjects((prev) =>
      prev.filter((subject) => subject.id !== dialogData.subject.id)
    );
    toggleDialog("delete", false);
  };

  const handleRegister = async () => {
    if (selectedSubjects?.length === 0) {
      showAlert(
        "Please select at least one subject before registering.",
        "destructive"
      );
      return;
    }

    if (selectedSubjects?.length > 1) {
      showAlert(
        "You can only register for one subject at a time.",
        "destructive"
      );
      return;
    }

    try {
      const response = await api.get(
        `/courses/register-course/${selectedSubjects?.map(
          (subject) => subject.id
        )}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      showAlert(response?.data?.message, "default");
    } catch (error) {
      showAlert(error.response?.data?.message || error.message, "destructive");
    }
  };

  const Dialog = ({ isOpen, title, children, onClose }) =>
    isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg max-w-md w-full">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          {children}
          {!dialogs.prereqConfirm && !dialogs.delete && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                OK
              </button>
            </div>
          )}
        </div>
      </div>
    );

  const SubjectList = ({ subjects, onDelete, isDraggable, onDragStart }) => {
    return (
      <div className="space-y-2">
        {subjects?.length > 0 ? (
          subjects.map((subject) => (
            <div
              key={subject.id}
              onClick={() =>
                onDragStart &&
                handleCourseClick(
                  subject.title,
                  setShowDetailsDialog,
                  setSubjectDetails
                )
              }
              draggable={isDraggable}
              onDragStart={(e) => onDragStart && onDragStart(e, subject)}
              className="p-3 bg-gray-50 rounded flex justify-between items-center cursor-pointer hover:bg-gray-100">
              <span>{subject.title}</span>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering onClick for the parent
                    onDelete(subject);
                  }}
                  className="text-red-500 hover:text-red-700">
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="text-gray-400 text-center py-8">
            No subjects available
          </div>
        )}
      </div>
    );
  };

  const output = Object.values(filters)
    .flat() // Flattens the array values
    .filter((item) => item) // Removes empty arrays or falsy values
    .join(" -> "); // Joins the elements with '->'

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header>
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Course Registration System
            </h1>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <button
              onClick={onBack}
              className="bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-900 mb-4 mt-5 ms-5">
              Back to Filters
            </button>
            <h5 className="ps-6 my-2 font-semibold">{output}</h5>
            <div className=" bg-gray-50 p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">
                    Available Subjects
                  </h2>
                  <SubjectList
                    subjects={subjects}
                    isDraggable
                    onDragStart={handleDragStart}
                  />
                </div>
                <div
                  className="bg-white p-6 rounded-lg shadow border-2 border-dashed border-gray-300"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}>
                  <h2 className="text-xl font-semibold mb-4">
                    Selected Subjects
                  </h2>
                  <SubjectList
                    subjects={selectedSubjects}
                    onDelete={handleDeleteClick}
                  />
                </div>
              </div>
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleRegister}
                  className="px-6 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900">
                  Register Subjects
                </button>
              </div>
              {alert.show && (
                <Alert className="mt-4" variant={alert.type}>
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </main>

        {/* Dialogs */}
        <Dialog
          isOpen={dialogs.error}
          title="Error"
          onClose={() => toggleDialog("error", false)}>
          <p>{dialogData.message}</p>
        </Dialog>
        <Dialog
          isOpen={dialogs.prereqConfirm}
          title="Prerequisites Required"
          onClose={() => toggleDialog("prereqConfirm", false)}>
          <p>{dialogData.message}</p>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => handlePreReqConfirm(false)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
              No
            </button>
            <button
              onClick={() => handlePreReqConfirm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Yes
            </button>
          </div>
        </Dialog>
        <Dialog
          isOpen={dialogs.certificate}
          title="Certificate Progress"
          onClose={() => toggleDialog("certificate", false)}>
          {dialogData.certificates?.map((cert, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded mb-2">
              <h4 className="font-semibold">{cert.certificateName}</h4>
              <p>{cert.message}</p>
            </div>
          ))}
        </Dialog>
        <Dialog
          isOpen={dialogs.delete}
          title="Confirm Deletion"
          onClose={() => toggleDialog("delete", false)}>
          <p>
            Are you sure you want to remove{" "}
            <strong>{dialogData.subject?.title}</strong>?
          </p>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => toggleDialog("delete", false)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Delete
            </button>
          </div>
        </Dialog>

        <ModalContent
          isShowModal={showDetailsDialog}
          closeModal={closeModal}
          subjectDetails={subjectDetails}
        />
      </div>
    </>
  );
};

export default Subject;
