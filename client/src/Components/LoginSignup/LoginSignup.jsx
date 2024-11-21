import React, { useState } from "react";
import "./LoginSignup.css";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, signupUser } from "../../api/baseApiUrl";

export const LoginSignup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [action, setAction] = useState("in");
  const [formerrors, setErrors] = useState({});

  /**
   * @description Function for programmatic navigation within the application,
   * likely used for redirecting the user to different routes.
   * Obtained using the `useNavigate` hook from react-router-dom.
   * @type {import('react-router-dom').Navigate}
   */
  const navigate = useNavigate();
  const {
    reset,
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({});

  const resetForm = () => {
    //setName('');
    setEmail("");
    //setPassword('');
    //setErrors({});
  };

  const validate = () => {
    const newErrors = {};

    // Validate Name (only for signup)
    if (action === "up") {
      if (!name.trim()) {
        newErrors.name = "Name is required";
      } else if (name.length < 2 || name.length > 50) {
        newErrors.name = "Name must be between 2 and 50 characters";
      }
    }

    // Validate Email
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email format is invalid";
    }

    // Validate Password
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    console.log("hit validate function");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // return true if no errors
  };

  async function login() {
    console.warn(email, password);
    let item = { email, password };
    if (validate()) {
      try {
        let userData = await loginUser(item);
        localStorage.setItem("loginUser", userData?.user?.username);
        localStorage.setItem("loginUserEmail", userData?.user?.email);
        localStorage.setItem("jwtToken", userData?.token);
        console.warn("Successful login");
        console.warn(userData);
        navigate("/drag-and-drop-course");
      } catch (error) {
        console.log(error);
      }
    } else {
      console.warn(formerrors);
    }
  }
  async function signup() {
    console.warn(email, password);
    let role = "student";
    let item = { name, email, password, role };
    try {
      let userData = await signupUser(item);
      localStorage.setItem("message", userData?.message);
      console.warn("Successful signup");
      console.warn(userData);
      setAction("in");
    } catch (error) {
      console.log(error);
    }
  }
  return (
    <div className="container">
      <div className="login">
        <form>
          <div className="signuptext">Sign {action} to continue </div>
          <div className="inputs form-control">
            {action === "in" ? (
              <div></div>
            ) : (
              <div className="input">
                <img src="" alt="" />
                <div className="text">Student Name</div>
                <input
                  type="text"
                  onChange={(e) => setName(e.target.value)}
                  className="textbox"
                />
                {formerrors.name && (
                  <div className="error">{formerrors.name}</div>
                )}
              </div>
            )}

            <div className="input form-control">
              <img src="" alt="" />
              <div className="text">Email</div>
              <input
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                className="textbox"
              />
              {formerrors.email && (
                <div className="error">{formerrors.email}</div>
              )}
            </div>
            <div className="input form-control">
              <img src="" alt="" />
              <div className="text">Password</div>
              <input
                type="password"
                required
                onChange={(e) => setPassword(e.target.value)}
                className="textbox"
              />
              {formerrors.password && (
                <div className="error">{formerrors.password}</div>
              )}
            </div>
          </div>
          {action === "in" ? (
            <div>
              <input
                type="button"
                className="signupbotton"
                style={{
                  background: "white",
                  color: "black",
                  border: "1px solid #b7b7b7",
                }}
                onClick={() => {
                  setAction("up");
                  resetForm();
                }}
                value="Sign Up"
              />
              <input
                type="button"
                className="signupbotton"
                onClick={() => {
                  validate();
                  login();
                }}
                value="Sign On"
              />
            </div>
          ) : (
            <div className="submit-container">
              <input
                type="button"
                className="signupbotton"
                style={{
                  background: "white",
                  color: "black",
                  border: "1px solid #b7b7b7",
                }}
                onClick={() => {
                  setAction("in");
                }}
                value="Sign On"
              />
              <input
                type="button"
                className="signupbotton"
                onClick={signup}
                value="Sign Up"
              />
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
