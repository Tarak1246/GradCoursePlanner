import React from "react";
import "./HeaderAndFooter.css";
import footer_logo from "../Assets/images/wright-footer.png";

const Footer = () => {
  return (
    <footer className="wsu-footer">
      <div className="wsu-footer-container">
        <a href="/" className="footer-logo">
          <img src={footer_logo} alt="Wright State University Logo" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
