import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../AuthContext/AuthContext';
import { useNavigate } from 'react-router-dom';


export const Navbar = () => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const {authLogout} = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    authLogout(); // Reset the authentication state
    navigate('/'); // Redirect to the login page
  };

  return (
    <div className="menucontainer">
      
          <div className="menu-bar">
            <ul>
              <li><NavLink to="/dashboard">Dashboard</NavLink></li>
              <li><NavLink to="/courses">View Courses</NavLink></li>
              <li><NavLink to="/register-classes">Register Classes</NavLink></li>
              <li><NavLink to="/program-of-study">Program of Study</NavLink></li>
              <li>
                <button
                  onClick={handleLogout}
                >Logout</button>
              </li>
            </ul>
          </div>
        </div>
  );
};

export default Navbar;
