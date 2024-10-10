import React, { useState } from 'react'
import './LoginSignup.css'

export const LoginSignup = () => {

  const [action, setAction] = useState("in");
  return (
    <div className="container">
      <div className="login">
        <div className="signuptext">Sign {action} to continue </div>  
        <div className="inputs">
          {action==="in"?<div></div>:<div className="input">
            <img src="" alt="" />
            <div className="text">Student Name</div>
            <input type="text" className="textbox" />
          </div>}
          
          <div className="input">
            <img src="" alt="" />
            <div className="text">Campus Username</div>
            <input type="email" className="textbox" />
          </div>
          <div className="input">
            <img src="" alt="" />
            <div className="text">Password</div>
            <input type="password" className="textbox" />
          </div>
        </div>
        {action==="in"?<div>
          <input type="button" className="signupbotton" style={{background:"white", color:"black", border:"1px solid #b7b7b7"}} onClick={()=>{setAction("up")}} value="Sign Up"/>
        <input type="button" className="signupbotton" onClick={()=>{setAction("in")}} value="Sign On"/>
        
        </div>:<div className="submit-container">
        <input type="button" className="signupbotton" style={{background:"white", color:"black", border:"1px solid #b7b7b7"}} onClick={()=>{setAction("in")}} value="Sign On"/>
        <input type="button" className="signupbotton" onClick={()=>{setAction("up")}} value="Sign Up"/>
        </div>
       }
        </div>
    </div>
  )
}
