import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../AuthContext/AuthContext";
import { useNavigate } from "react-router-dom";
import profile_logo from "../Assets/images/profilesvg.jpg";

export const Navbar = () => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { authLogout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    authLogout(); // Reset the authentication state
    localStorage.clear(); // Clear the local storage
    navigate("/"); // Redirect to the login page
  };
  const [isOpen, setIsOpen] = useState(false);
  const handleFocus = () => setDropdownOpen(true);
  const handleMouseEnter = () => {
    setDropdownOpen(true); // Open on hover
  };

  const handleMouseLeave = () => {
    setDropdownOpen(false); // Close on mouse leave
  };
  const handleBlur = (e) => {
    // Check if focus has left the dropdown container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropdownOpen(false);
    }
  };
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="menucontainer mb-8">
      <div className="menu-bar">
        <nav className="pt-2">
          <ul>
            <li>
              <NavLink to="/dashboard">Dashboard</NavLink>
            </li>
            <li>
              <NavLink to="/courses">View Courses</NavLink>
            </li>
            <li>
              <NavLink to="/register-classes">Register</NavLink>
            </li>
            <li>
              <NavLink to="/program-of-study">Program</NavLink>
            </li>
            <li>
              <a>
                <button onClick={handleLogout}>Logout</button>
              </a>
            </li>
            <li className="dropdown" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onBlur={handleBlur} onFocus={handleFocus} tabIndex={-1}>
              <a >
                <button className="dropdown-btn">
                  <img
                    src={profile_logo}
                    alt="Profile"
                    className="profile-icon"
                  />
                  {localStorage.getItem("loginUser")}
                </button>
              </a>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-item">
                    {localStorage.getItem("loginUser")}
                  </div>
                  <div className="dropdown-item">
                    {localStorage.getItem("loginUserEmail")}
                  </div>
                  <div className="dropdown-item">Graduate Student</div>
                  <div
                    className="dropdown-item logout"
                    onClick={() => handleLogout()}>
                    Logout
                  </div>
                </div>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Navbar;
