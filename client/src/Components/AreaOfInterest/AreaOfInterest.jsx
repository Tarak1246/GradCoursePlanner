import React, { useState, useEffect } from "react";

import "./AreaOfInterest.css";

import {
  fetchAreaOfInterestData,
  handleCourseClick,
} from "../../api/baseApiUrl";

import ModalContent from "../../Modal/ModalContent";

const AreaOfInterest = () => {
  const [areasOfInterest, setAreasOfInterest] = useState({});
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);

  useEffect(() => {
    fetchAreaOfInterestData(setAreasOfInterest, setError);
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(sectionData).map(([category, courses]) => (
              <div
                key={category}
                className="bg-white m-2 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 area-card overflow-auto max-h-[26rem]">
                <div className="flex items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {category}
                  </h3>
                </div>

                <ul className="space-y-2 text-left">
                  {courses.map((course, index) => {
                    let spiltArray = course.split(" ");

                    return (
                      <li
                        key={index}
                        className="text-gray-800 hover:text-green-700 transition-colors duration-200 cursor-pointer block"
                        onClick={() =>
                          handleCourseClick(
                            spiltArray.slice(2).join(" "),
                            setIsModalOpen,
                            setCourseDetails
                          )
                        }>
                        {course}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}

      <ModalContent
        isShowModal={isModalOpen}
        closeModal={closeModal}
        subjectDetails={courseDetails}
      />
    </div>
  );
};

export default AreaOfInterest;
