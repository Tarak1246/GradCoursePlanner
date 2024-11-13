import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "../Alert/alert";

const DragAndDropCourse = () => {
  const [subjects] = useState([
    "Distributed Computing",
    "Advanced Wireless Network",
    "Advanced Computer Network",
    "Advanced Design and Algorithm",
    "Computer Science I",
    "Quantum Computing",
    "Quantum Algorithm",
  ]);

  // Define prerequisites for subjects
  const prerequisites = {
    "Distributed Computing": ["Computer Science I"],
    "Advanced Wireless Network": [
      "Computer Science I",
      "Advanced Computer Network",
    ],
    "Quantum Algorithm": ["Quantum Computing"],
    "Advanced Design and Algorithm": ["Computer Science I"],
  };

  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPrereqDialog, setShowPrereqDialog] = useState(false);
  const [lastAddedSubject, setLastAddedSubject] = useState("");
  const [subjectToDelete, setSubjectToDelete] = useState("");
  const [prerequisiteMessage, setPrerequisiteMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const handleDragStart = (e, subject) => {
    e.dataTransfer.setData("subject", subject);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const checkPrerequisites = (subject) => {
    if (prerequisites[subject]) {
      const missingPrereqs = prerequisites[subject].filter(
        (prereq) => !selectedSubjects.includes(prereq)
      );

      if (missingPrereqs.length > 0) {
        setPrerequisiteMessage(
          `Before taking ${subject}, you need to complete: ${missingPrereqs.join(
            ", "
          )}`
        );
        return false;
      }
    }
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const subject = e.dataTransfer.getData("subject");

    if (!selectedSubjects.includes(subject)) {
      if (checkPrerequisites(subject)) {
        setSelectedSubjects([...selectedSubjects, subject]);
        setLastAddedSubject(subject);
        setShowAddDialog(true);
      } else {
        setShowPrereqDialog(true);
      }
    }
  };

  const handleDeleteClick = (subject) => {
    // Check if this subject is a prerequisite for any currently selected subjects
    const dependentSubjects = selectedSubjects.filter((selected) =>
      prerequisites[selected]?.includes(subject)
    );

    if (dependentSubjects.length > 0) {
      setAlertMessage(
        `Cannot remove ${subject} as it is a prerequisite for: ${dependentSubjects.join(
          ", "
        )}`
      );
      setShowAlert(true);
      return;
    }

    setSubjectToDelete(subject);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    setSelectedSubjects(
      selectedSubjects.filter((subject) => subject !== subjectToDelete)
    );
    setShowDeleteDialog(false);
  };

  const handleRegister = () => {
    if (selectedSubjects.length === 0) {
      setAlertMessage("Please select at least one subject before registering.");
      setShowAlert(true);
      return;
    }

    // Here you would typically make an API call to save the registration
    console.log("Registering subjects:", selectedSubjects);
    setAlertMessage(
      "Registration successful! Your selected subjects have been saved."
    );
    setShowAlert(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Course Registration System
          </h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Available Subjects */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">
                    Available Subjects
                  </h2>
                  <div className="space-y-2">
                    {subjects.map((subject) => (
                      <div
                        key={subject}
                        draggable
                        onDragStart={(e) => handleDragStart(e, subject)}
                        className="p-3 bg-gray-50 rounded cursor-move hover:bg-gray-100 transition-colors">
                        {subject}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Subjects */}
                <div
                  className="bg-white p-6 rounded-lg shadow border-2 border-dashed border-gray-300"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}>
                  <h2 className="text-xl font-semibold mb-4">
                    Selected Subjects
                  </h2>
                  <div className="space-y-2 min-h-48">
                    {selectedSubjects.map((subject) => (
                      <div
                        key={subject}
                        className="p-3 bg-gray-50 rounded flex justify-between items-center">
                        <span>{subject}</span>
                        <button
                          onClick={() => handleDeleteClick(subject)}
                          className="text-red-500 hover:text-red-700">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                    {selectedSubjects.length === 0 && (
                      <div className="text-gray-400 text-center py-8">
                        Drag and drop subjects here
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Register Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleRegister}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Register Subjects
                </button>
              </div>

              {/* Alert */}
              {showAlert && (
                <Alert
                  className="mt-4"
                  variant={
                    alertMessage.includes("successful")
                      ? "default"
                      : "destructive"
                  }>
                  <AlertDescription>{alertMessage}</AlertDescription>
                </Alert>
              )}

              {/* Add Subject Dialog */}
              {showAddDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-white p-6 rounded-lg max-w-md w-full">
                    <h3 className="text-lg font-semibold mb-2">
                      Subject Added Successfully
                    </h3>
                    <p>
                      You have successfully added{" "}
                      <strong>{lastAddedSubject}</strong> to your selected
                      subjects.
                    </p>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => setShowAddDialog(false)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        OK
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Prerequisite Warning Dialog */}
              {showPrereqDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-white p-6 rounded-lg max-w-md w-full">
                    <h3 className="text-lg font-semibold mb-2">
                      Prerequisites Required
                    </h3>
                    <p>{prerequisiteMessage}</p>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => setShowPrereqDialog(false)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        OK
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete Confirmation Dialog */}
              {showDeleteDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-white p-6 rounded-lg max-w-md w-full">
                    <h3 className="text-lg font-semibold mb-2">
                      Confirm Deletion
                    </h3>
                    <p>
                      Are you sure you want to remove{" "}
                      <strong>{subjectToDelete}</strong> from your selected
                      subjects?
                    </p>
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={() => setShowDeleteDialog(false)}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                        Cancel
                      </button>
                      <button
                        onClick={confirmDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DragAndDropCourse;
