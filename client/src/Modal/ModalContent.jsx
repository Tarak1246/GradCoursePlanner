import React from "react";

const ModalContent = ({ courseDetails }) => {
  if (!courseDetails) return <p>Loading...</p>;

  const values = courseDetails.values[0];
  return {
    "Instructor / Meeting Times": (
      <div>
        <p className="text-gray-700 text-[14px] pb-2">
          <strong className="text-[14px]">Instructor:</strong>{" "}
          {values.instructor}
        </p>
        <p className="text-gray-700 text-[14px] pb-2">
          <strong className="text-[14px]">Days:</strong>{" "}
          {values.days?.toUpperCase().split("").join(" ")}
        </p>
        <p className="text-gray-700 text-[14px] pb-2">
          <strong className="text-[14px]">Duration:</strong> {values.duration}
        </p>
        <p className="text-gray-700 text-[14px] pb-2">
          <strong className="text-[14px]">Time:</strong> {values.time}
        </p>
      </div>
    ),
    "Class Details": (
      <div>
        <p className="text-gray-700 text-[14px] pb-2">
          <strong>Associated Term:</strong> {values.semester} {values.year}
        </p>
        <p className="text-gray-700 text-[14px] pb-2">
          <strong>CRN:</strong> {values.crn}
        </p>
        <p className="text-gray-700 text-[14px] pb-2">
          <strong>Campus:</strong> {values.campus}
        </p>
        <p className="text-gray-700 text-[14px] pb-2">
          <strong>Section:</strong> {values.section}
        </p>
        <p className="text-gray-700 text-[14px] pb-2">
          <strong>Subject:</strong> {values.subject}
        </p>
        <p className="text-gray-700 text-[14px] pb-2">
          <strong>Course Number:</strong> {values.course}
        </p>
      </div>
    ),
  };
};

export default ModalContent;
