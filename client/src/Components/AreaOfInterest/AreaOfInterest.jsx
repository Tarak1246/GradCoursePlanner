import React, { useState } from "react";
import "./AreaOfInterest.css";
import {
  FaCode,
  FaMicrochip,
  FaBrain,
  FaChartBar,
  FaEye,
  FaCalculator,
  FaShieldAlt,
  FaDatabase,
} from "react-icons/fa";

const areasOfInterest = {
  Software: ["Software Engineering", "Mobile Development", "Web Development"],
  Hardware: ["Embedded Systems", "Computer Architecture"],
  "Intelligent Systems": ["Artificial Intelligence", "Machine Learning"],
  "Data Analysis": ["Data Mining", "Statistical Analysis"],
  "Vision and Graphics": ["Computer Vision", "Graphics Programming"],
  "Mathematics of Computations": ["Numerical Analysis", "Optimization"],
  "Secure Software/Hardware": ["Cybersecurity", "Cryptography"],
  "Data Science": ["Big Data", "Data Visualization"],
};

const icons = {
  Software: <FaCode />,
  Hardware: <FaMicrochip />,
  "Intelligent Systems": <FaBrain />,
  "Data Analysis": <FaChartBar />,
  "Vision and Graphics": <FaEye />,
  "Mathematics of Computations": <FaCalculator />,
  "Secure Software/Hardware": <FaShieldAlt />,
  "Data Science": <FaDatabase />,
};

const AreaOfInterest = () => {
  const [selectedArea, setSelectedArea] = useState("All");

  const handleFilterChange = (event) => {
    setSelectedArea(event.target.value);
  };

  return (
    <div className="area-of-interest-container">
      <h1>Explore Areas of Interest</h1>
      <div className="filter">
        <select onChange={handleFilterChange}>
          <option value="All">All Areas</option>
          {Object.keys(areasOfInterest).map((area, index) => (
            <option key={index} value={area}>
              {area}
            </option>
          ))}
        </select>
      </div>
      <div className="interest-areas">
        {Object.keys(areasOfInterest).map(
          (area) =>
            (selectedArea === "All" || selectedArea === area) && (
              <div key={area} className="area-card">
                <div className="icon-container">{icons[area]}</div>
                <h2>{area}</h2>
                <ul>
                  {areasOfInterest[area].map((subject) => (
                    <li key={subject}>{subject}</li>
                  ))}
                </ul>
              </div>
            )
        )}
      </div>
    </div>
  );
};

export default AreaOfInterest;
