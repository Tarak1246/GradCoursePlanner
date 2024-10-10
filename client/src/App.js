import React, { useEffect } from 'react';
import './App.css';
import { LoginSignup } from './Components/LoginSignup/LoginSignup';
import header_logo from './Components/Assets/images/wright-header.png';
import footer_logo from './Components/Assets/images/wright-footer.png';


const App = () => {

  useEffect(() => {
    
  }, []);

  return (
    <div className="App">
      {/* implement all routes here using react router */}
          <div className="header" role="banner">
              <div className="header-img">
                  <img src={header_logo} alt="Wright State University" width="400" height="50"></img>
              </div>
          </div>
          <LoginSignup />
          <div className="footer">
              <div className="foottext">
                  <img src={footer_logo} alt="Wright State University" width="400" height="150"></img>
              </div>
          </div>
    </div>
  );
};

export default App;
