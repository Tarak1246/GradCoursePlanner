import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import "./styles/globals.css";

import AreaOfInterest from "./Components/AreaOfInterest/AreaOfInterest";
import DragAndDropCourse from "./Components/DragAndDropCourse/DragAndDropCourse";
import Footer from "./Components/HeaderAndFooter/Footer";
import Header from "./Components/HeaderAndFooter/Header";
import { LoginSignup } from "./Components/LoginSignup/LoginSignup";
import Navbar from "./Components/Navbar/Navbar";
import PrivateRoute from "./Components/AuthContext/PrivateRoute";
import { AuthProvider } from "./Components/AuthContext/AuthContext";
import Dashboard from "./Components/Dashboard/Dashboard";
import Layout from "./Components/Layout/Layout";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  return (
    <div className="App">
      <Header />
      {localStorage.getItem("isUserLoginIn") === true ? (
        <Navbar />
      ) : (
        <div></div>
      )}
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Login Route */}
            <Route path="/" element={<LoginSignup onLogin={handleLogin} />} />

            {/* Protected Routes Wrapped in Layout */}
            <Route path="/" element={<Layout onLogout={handleLogout} />}>
              <Route
                path="dashboard"
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="courses"
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <AreaOfInterest />
                  </PrivateRoute>
                }
              />
              <Route
                path="register-classes"
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <DragAndDropCourse />
                  </PrivateRoute>
                }
              />
              <Route
                path="program-of-study"
                element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <DragAndDropCourse />
                  </PrivateRoute>
                }
              />
            </Route>

            {/* Catch-All Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
      <Footer />
    </div>
  );
};

export default App;
