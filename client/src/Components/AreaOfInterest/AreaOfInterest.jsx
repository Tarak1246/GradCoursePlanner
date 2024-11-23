import React, { useState, useEffect } from "react";
import {
  fetchAreaOfInterestData,
  handleCourseClick,
} from "../../api/baseApiUrl";
import "./AreaOfInterest.css";
import Modal from "../../Modal/Modal";

const AreaOfInterest = () => {
  const [areasOfInterest, setAreasOfInterest] = useState({});
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);

  useEffect(() => {
    fetchAreaOfInterestData(setAreasOfInterest, setError);
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null);
    setCourseDetails(null);
  };

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-100 rounded-lg">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        Explore Areas of Interest
      </h1>

      {Object.entries(areasOfInterest).map(([sectionName, sectionData]) => (
        <div key={sectionName} className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b-2 pb-2">
            {sectionName}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(sectionData).map(([category, courses]) => (
              <div
                key={category}
                className="bg-white m-2 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 area-card">
                <div className="flex items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {category}
                  </h3>
                </div>

                <ul className="space-y-2 text-left">
                  {courses.map((course, index) => (
                    <li
                      key={index}
                      className="text-gray-800 hover:text-green-700 transition-colors duration-200 cursor-pointer block"
                      onClick={() =>
                        handleCourseClick(
                          course,
                          setSelectedCourse,
                          setIsModalOpen,
                          setCourseDetails
                        )
                      }>
                      {course}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}

      {isModalOpen && (
        <Modal
          onClose={closeModal}
          sections={{
            " Instructor / Meeting Times": (
              <div>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Instructor:</strong>{" "}
                  {courseDetails?.values[0]?.instructor}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Days:</strong>{" "}
                  {courseDetails?.values[0]?.days
                    ?.toUpperCase()
                    .split("")
                    .join(" ")}
                </p>

                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Duration:</strong>{" "}
                  {courseDetails?.values[0]?.duration}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Time:</strong>{" "}
                  {courseDetails?.values[0]?.time}
                </p>
              </div>
            ),
            "Class Details": (
              <div>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Associated Term:</strong>{" "}
                  {courseDetails?.values[0]?.semester}{" "}
                  {courseDetails?.values[0]?.year}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">CRN:</strong>{" "}
                  {courseDetails?.values[0]?.crn}{" "}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Campus:</strong>{" "}
                  {courseDetails?.values[0]?.campus}{" "}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Section:</strong>{" "}
                  {courseDetails?.values[0]?.section}{" "}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Subject:</strong>{" "}
                  {courseDetails?.values[0]?.subject}{" "}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Course Number:</strong>{" "}
                  {courseDetails?.values[0]?.course}{" "}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Title:</strong>{" "}
                  {courseDetails?.values[0]?.title}{" "}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Credit Hours:</strong>{" "}
                  {courseDetails?.values[0]?.credits}{" "}
                </p>
              </div>
            ),
            Attributes: (
              <div>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Attributes:</strong>{" "}
                  {courseDetails?.values[0]?.attribute}
                </p>
              </div>
            ),
            Restrictions: (
              <div>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Restrictions:</strong>{" "}
                  {courseDetails?.values[0]?.restrictions || "None"}
                </p>
              </div>
            ),
            Prerequisites: (
              <div>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Prerequisites:</strong>{" "}
                  {courseDetails?.values[0]?.prerequisites.length > 0
                    ? courseDetails?.values[0]?.prerequisites.join(", ")
                    : "None"}
                </p>
              </div>
            ),
            "Enrollment / Waitlist": (
              <div>
                <p className="text-gray-700 text-[14px]">
                  <strong className="text-[14px]">Status:</strong>{" "}
                  {courseDetails?.values[0]?.status}
                </p>
                <br></br>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Enrollment Capacity:</strong>{" "}
                  {courseDetails?.values[0]?.sectionCapacity}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Enrollment Actual:</strong>{" "}
                  {courseDetails?.values[0]?.sectionActual}
                </p>
                <p className="text-gray-700 text-[14px]">
                  <strong className="text-[14px]">Enrollment Remaining:</strong>{" "}
                  {courseDetails?.values[0]?.sectionRemaining}
                </p>
                <br></br>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Waitlist Capacity:</strong>{" "}
                  {courseDetails?.values[0]?.waitlistCapacity}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Waitlist Actual:</strong>{" "}
                  {courseDetails?.values[0]?.waitlistActual}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Waitlist Remaining:</strong>{" "}
                  {courseDetails?.values[0]?.waitlistRemaining}
                </p>
              </div>
            ),
            "Cross List": (
              <div>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">CrossList Capacity:</strong>{" "}
                  {courseDetails?.values[0]?.crosslistCapacity}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">CrossList Actual:</strong>{" "}
                  {courseDetails?.values[0]?.crosslistActual}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">CrossList Remaining:</strong>{" "}
                  {courseDetails?.values[0]?.crosslistRemaining}
                </p>
              </div>
            ),
            Catalog: (
              <div>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Title:</strong>{" "}
                  {courseDetails?.values[0]?.title}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Campus:</strong>{" "}
                  {courseDetails?.values[0]?.campus}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Location:</strong>{" "}
                  {courseDetails?.values[0]?.location}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Credit Hours:</strong>{" "}
                  {courseDetails?.values[0]?.credits}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Levels:</strong>{" "}
                  {courseDetails?.values[0]?.level}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Attributes:</strong>{" "}
                  {courseDetails?.values[0]?.attribute}
                </p>
                <p className="text-gray-700 text-[14px] pb-2">
                  <strong className="text-[14px]">Category:</strong>{" "}
                  {courseDetails?.values[0]?.category.join(", ")}
                </p>
                <h5 className="text-gray-700 pb-2 text-[14px]">
                  <strong>Certification Requirements:</strong>{" "}
                  {courseDetails?.values[0]?.certificationRequirements.join(
                    ", "
                  )}
                </h5>
              </div>
            ),
          }}
          title={`Class Details for ${courseDetails?.values[0]?.title} ${courseDetails?.values[0]?.subject} ${courseDetails?.values[0]?.course} ${courseDetails?.values[0]?.section}`}
        />
      )}
    </div>
  );
};

export default AreaOfInterest;
