import React from "react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  // const navigate = useNavigate();
  // const goToCourse = () => {
  //       navigate('/courses');
  //   };

  //   const goToRegister = () => {
  //       navigate('/register-classes');
  //   };

  return (
    <div className="dcontainer">
      <div className="dashboardcontainer">
        <div className="dashheader">
          <p>Welcome to Wright State University Course Planner</p>
        </div>
        <div className="dashbuttons">
          <NavLink to="/courses">
            <button className="button bg-green-800">View Courses</button>
          </NavLink>
          <NavLink to="/register-classes">
            <button className="button bg-green-800">Register Classes</button>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
