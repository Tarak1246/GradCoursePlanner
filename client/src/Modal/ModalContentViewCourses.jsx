import React from "react";
import Modal from "./Modal";

const ModalContentViewCourses = ({
  isShowModal,
  closeModal,
  subjectDetails,
}) => {
  if (!isShowModal) return null;

  const details = subjectDetails?.values[0] || {};

  const {
    crn,
    campus,
    section,
    subject,
    course,
    title,
    credits,
    attribute,
    restrictions,
    prerequisites = [],
    location,
    level,
    category = [],
    certificationRequirements = [],
    feedback = [],
  } = details;

  const renderSection = (label, content) => (
    <p className="text-gray-700 text-[14px] pb-2">
      <strong className="text-[14px]">{label}:</strong> {content || "None"}
    </p>
  );

  const renderJoinedSection = (label, contentArray) => (
    <p className="text-gray-700 text-[14px] pb-2">
      <strong className="text-[14px]">{label}:</strong>{" "}
      {contentArray.length > 0 ? contentArray.join(", ") : "None"}
    </p>
  );

  const sections = {
    "Class Details": (
      <div>
        {renderSection("CRN", crn)}
        {renderSection("Campus", campus)}
        {renderSection("Section", section)}
        {renderSection("Subject", subject)}
        {renderSection("Course Number", course)}
        {renderSection("Title", title)}
        {renderSection("Credit Hours", credits)}
      </div>
    ),
    Attributes: <div>{renderSection("Attributes", attribute)}</div>,
    Restrictions: <div>{renderSection("Restrictions", restrictions)}</div>,
    Prerequisites: (
      <div>{renderJoinedSection("Prerequisites", prerequisites)}</div>
    ),

    Catalog: (
      <div>
        {renderSection("Title", title)}
        {renderSection("Campus", campus)}
        {renderSection("Location", location)}
        {renderSection("Credit Hours", credits)}
        {renderSection("Levels", level)}
        {renderSection("Attributes", attribute)}
        {renderJoinedSection("Category", category)}
        {renderJoinedSection(
          "Certification Requirements",
          certificationRequirements
        )}
      </div>
    ),
    Feedback:
      feedback.length > 0 ? (
        feedback?.map(({ name, feedback, semester, year, date }) => (
          <div className="mb-5">
            {renderSection("Name", name)}
            {renderSection("Feedback", feedback)}
            {renderSection("Semester", semester)}
            {renderSection("Year", year)}
            {renderSection("Date", date)}
          </div>
        ))
      ) : (
        <div className="m-5 text-center">No Feedback Available</div>
      ),
  };

  const modalTitle = `Class Details for ${title} ${subject} ${course} ${section}`;

  return <Modal onClose={closeModal} sections={sections} title={modalTitle} />;
};

export default ModalContentViewCourses;
