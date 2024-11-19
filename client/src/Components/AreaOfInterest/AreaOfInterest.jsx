import React, { useState, useEffect } from "react";
import baseApiUrl from "../../api/baseApiUrl";
import "./AreaOfInterest.css";

const AreaOfInterest = () => {
  const [areasOfInterest, setAreasOfInterest] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await baseApiUrl.get("/courses/all");
        setAreasOfInterest(response.data);
      } catch (err) {
        setError("Failed to load data");
      }
    };

    fetchData();
  }, []);

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
            {Object.entries(sectionData).map(([category, courses]) => {
              return (
                <div
                  key={category}
                  className="bg-white m-2 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 area-card">
                  <div className="flex items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {category}
                    </h3>
                  </div>

                  <ul className="space-y-2">
                    {courses.map((course, index) => (
                      <li
                        key={index}
                        className="text-gray-800 hover:text-green-700 transition-colors duration-200">
                        {course}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AreaOfInterest;
