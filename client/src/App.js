import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import "./App.css";
import "./styles/globals.css";

import AreaOfInterest from "./Components/AreaOfInterest/AreaOfInterest";
import DragAndDropCourse from "./Components/DragAndDropCourse/DragAndDropCourse";
import Footer from "./Components/HeaderAndFooter/Footer";
import Header from "./Components/HeaderAndFooter/Header";
import { LoginSignup } from "./Components/LoginSignup/LoginSignup";

const App = () => {
  return (
    <div className="App">
      <Header />
      <Router>
        <Routes>
          <Route path="/area-of-interest" element={<AreaOfInterest />} />
        </Routes>
        <Routes>
          <Route path="/drag-and-drop-course" element={<DragAndDropCourse />} />
        </Routes>
        <Routes>
          <Route path="/" element={<LoginSignup />} />
        </Routes>
      </Router>
      <Footer />
    </div>
  );
};

export default App;
