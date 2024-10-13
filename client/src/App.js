import React from "react";
import "./App.css";
import { LoginSignup } from "./Components/LoginSignup/LoginSignup";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AreaOfInterest from "./Components/AreaOfInterest/AreaOfInterest";
import Header from "./Components/HeaderAndFooter/Header";
import Footer from "./Components/HeaderAndFooter/Footer";

const App = () => {
  return (
    <div className="App">
      <Header />
      <Router>
        <Routes>
          <Route path="/area-of-interest" element={<AreaOfInterest />} />
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
