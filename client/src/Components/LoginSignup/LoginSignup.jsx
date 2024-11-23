import React, { useState } from "react";
import "./LoginSignup.css";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, signupUser } from "../../api/baseApiUrl";
import { useAuth } from "../AuthContext/AuthContext";

export const LoginSignup = ({ onLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [action, setAction] = useState("in");
  const [errorMessage, setErrorMessage] = useState("");
  const { authLogin } = useAuth();

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

  const resetError = () => {
    setErrorMessage("");
  };

  const onSubmit = (data) => {
    console.warn("form data", data);
    if (action === "in") {
      login(data);
    } else {
      signup(data);
    }
  };

  async function login(data) {
    let email = data.email;
    let password = data.password;
    console.warn(email, password);
    let item = { email, password };
    localStorage.setItem("loginUserEmail", data.email);
    authLogin();
    onLogin();
    navigate("/Dashboard");
    try {
      console.log("hit signin function");

      let userData = await loginUser(item);
      console.log(userData.token);
      localStorage.setItem("loginUser", userData?.user?.username);
      localStorage.setItem("loginUserEmail", userData?.user?.email);
      localStorage.setItem("jwtToken", userData?.token);
      localStorage.setItem("isUserLoginIn", true);
      console.warn("Successful login");
      console.warn(userData);
      navigate("/Dashboard");
    } catch (error) {
      setErrorMessage("Invalid username or password. Please try again.");
      console.log(error);
    }
  }
  async function signup(data) {
    let name = data.name;
    let email = data.email;
    let password = data.password;
    let role = "student";
    console.warn(name, email, password);

    let item = { name, email, password, role };
    try {
      console.log("hit signup function");
      let userData = await signupUser(item);
      console.warn(userData);
      localStorage.setItem("message", userData?.message);
      console.warn("Successful signup");
      console.warn(userData);
      setAction("in");
      reset();
    } catch (error) {
      console.log(error);
    }
  }
  return (
    <div className="container">
      <div className="login">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="signuptext">Sign {action} to continue</div>
          {errorMessage && <div className="error">{errorMessage}</div>}
          <div className="inputs form-control">
            {action === "in" ? null : (
              <div className="input">
                <img src="" alt="" />
                <div className="text">Student Name</div>
                <input
                  type="text"
                  {...register("name", {
                    required: "Name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                    maxLength: {
                      value: 50,
                      message: "Name must not exceed 50 characters",
                    },
                  })}
                  className="textbox"
                />
                {errors.name && (
                  <div className="error">{errors.name.message}</div>
                )}
              </div>
            )}

            <div className="input form-control">
              <img src="" alt="" />
              <div className="text">Email</div>
              <input
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^@ ]+@[^@ ]+\.[^@ .]{2,}$/,
                    message: "Invalid email address",
                  },
                  pattern: {
                    value: /^[^@ ]+@wright\.edu$/,
                    message: "Email must end with @wright.edu",
                  },
                })}
                className="textbox"
              />
              {errors.email && (
                <div className="error">{errors.email.message}</div>
              )}
            </div>

            <div className="input form-control">
              <img src="" alt="" />
              <div className="text">Password</div>
              <input
                type="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                  pattern: {
                    value:
                      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                    message:
                      "Password must include uppercase, lowercase, number, and special character",
                  },
                })}
                className="textbox"
              />
              {errors.password && (
                <div className="error">{errors.password.message}</div>
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
                  reset();
                  resetError();
                  clearErrors();
                }}
                value="Sign Up"
              />
              <input type="submit" className="signupbotton" value="Sign On" />
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
                  reset();
                  resetError();
                  clearErrors();
                }}
                value="Sign On"
              />
              <input type="submit" className="signupbotton" value="Sign Up" />
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
