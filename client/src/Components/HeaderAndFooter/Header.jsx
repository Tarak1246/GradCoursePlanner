import React from "react";
import "./HeaderAndFooter.css";
import header_logo from "../Assets/images/wright-header.png";

const Header = () => {
  return (
    <header className="wsu-header">
      <div className="wsu-header-container">
        <a href="/" className="wsu-logo">
          <img src={header_logo} alt="Wright State University Logo" />
        </a>
      </div>
    </header>
  );
};

export default Header;
