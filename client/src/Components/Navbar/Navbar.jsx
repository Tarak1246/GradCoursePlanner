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

  const handleLogout = () => {
    authLogout(); // Reset the authentication state
    navigate("/"); // Redirect to the login page
  };
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="menucontainer mb-8">
      <div className="menu-bar">
        <nav>
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
            <li className="dropdown">
              <a>
                <button onClick={toggleDropdown} className="dropdown-btn">
                  <img
                    src={profile_logo}
                    alt="Profile"
                    className="profile-icon"
                  />
                  Akshay
                </button>
              </a>
              {isOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-item">
                    {localStorage.getItem("loginUserEmail")}
                  </div>
                  <div className="dropdown-item">Graduate Student</div>
                  <div
                    className="dropdown-item logout"
                    onClick={() => alert("Logged out!")}>
                    Logout
                  </div>
                </div>
              )}
            </li>

            {/* <li>
                <button
                  onClick={handleLogout}
                >Logout</button>
              </li> */}
          </ul>
          {/* <ul className=''>
            <li className="dropdown">
                      <button onClick={toggleDropdown} className="dropdown-btn">
                          <img
                              src="https://via.placeholder.com/24"
                              alt="Profile"
                              className="profile-icon"
                          />
                          Name
                      </button>
                      {isOpen && (
                          <div className="dropdown-menu">
                              <div className="dropdown-item">
                                  <strong>Email:</strong> user@example.com
                              </div>
                              <div className="dropdown-item">
                                  <strong>Role:</strong> Admin
                              </div>
                              <div className="dropdown-item logout" onClick={() => alert('Logged out!')}>
                                  Logout
                              </div>
                          </div>
                      )}
            </li>
            </ul> */}
        </nav>
        {/* <nav>
    <ul class="sidebar">
      <li onclick="hideSidebar()"><a href="#"><svg xmlns="http://www.w3.org/2000/svg" height="26" viewBox="0 96 960 960" width="26"><path d="m249 849-42-42 231-231-231-231 42-42 231 231 231-231 42 42-231 231 231 231-42 42-231-231-231 231Z"></path></svg></a></li>
      <li><a href="#">Blog</a></li>
      <li><a href="#">Products</a></li>
      <li><a href="#">About</a></li>
      <li><a href="#">Forum</a></li>
      <li><a href="#">Login</a></li>
    </ul>
    <ul>
      <li><a href="#">Coding2go</a></li>
      <li class="hideOnMobile"><a href="#">Blog</a></li>
      <li class="hideOnMobile"><a href="#">Products</a></li>
      <li class="hideOnMobile"><a href="#">About</a></li>
      <li class="hideOnMobile"><a href="#">Forum</a></li>
      <li class="hideOnMobile"><a href="#">Login</a></li>
      <li class="menu-button" onclick="showSidebar()"><a href="#"><svg xmlns="http://www.w3.org/2000/svg" height="26" viewBox="0 96 960 960" width="26"><path d="M120 816v-60h720v60H120Zm0-210v-60h720v60H120Zm0-210v-60h720v60H120Z"></path></svg></a></li>
    </ul>
  </nav> */}
      </div>
    </div>
  );
};

export default Navbar;
