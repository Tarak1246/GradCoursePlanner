import React, { useState } from "react";
import "./LoginSignup.css";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { loginUser, signupUser } from "../../api/baseApiUrl";
import { useAuth } from "../AuthContext/AuthContext";

export const LoginSignup = ({ onLogin }) => {
  const [action, setAction] = useState("login");
  const [errorMessage, setErrorMessage] = useState("");
  const { authLogin } = useAuth();
  const navigate = useNavigate();
  const {
    reset,
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm();

  const resetError = () => {
    setErrorMessage("");
  };

  const handleActionToggle = (newAction) => {
    setAction(newAction);
    reset();
    resetError();
    clearErrors();
  };

  const onSubmit = async (data) => {
    try {
      if (action === "login") {
        await handleLogin(data);
      } else {
        await handleSignup(data);
      }
    } catch (error) {
      setErrorMessage(error?.message || "An unexpected error occurred.");
    }
  };

  const handleLogin = async (data) => {
    try {
      const userData = await loginUser(data);
      if(userData?.status == 200){
        localStorage.setItem("loginUser", userData?.user?.name);
        localStorage.setItem("loginUserEmail", userData?.user?.email);
        localStorage.setItem("isUserLoginIn", "true");
        localStorage.setItem("id", userData?.user?.id);
        localStorage.setItem("jwtToken", userData?.token);
        onLogin();
        authLogin();
        navigate("/Dashboard");
      }else{
        setErrorMessage("Invalid username or password. Please try again.");
      }
    } catch (error) {
      setErrorMessage("Invalid username or password. Please try again.");
    }
  };

  const handleSignup = async (data) => {
    data["role"] = "student";
    try {
      const signUpResponse = await signupUser(data);
      console.log(signUpResponse);
      if(signUpResponse?.status == 201){
        setAction("login");
        reset();
      }else{
        setErrorMessage(signUpResponse?.message || "Signup failed.");
      }   
    } catch (error) {
      console.log(error);
      setErrorMessage(error?.response?.data?.message || "Signup failed.");
    }
  };

  const renderInputField = (label, name, type, validation, placeholder) => (
    <div className="input form-control">
      <label className="text">{label}</label>
      <input
        type={type}
        {...register(name, validation)}
        className="textbox"
        placeholder={placeholder}
        aria-label={label}
      />
      {errors[name] && <div className="error">{errors[name].message}</div>}
    </div>
  );

  return (
    <div className="container">
      <div className="login">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="signuptext">
            {action === "login" ? "Sign in to continue" : "Sign up to continue"}
          </div>
          {errorMessage && <div className="error">{errorMessage}</div>}
          <div className="inputs form-control">
            {action === "signup" &&
              renderInputField("Student Name", "name", "text", {
                required: "Name is required",
                minLength: { value: 2, message: "Name must be at least 2 characters" },
                maxLength: { value: 50, message: "Name must not exceed 50 characters" },
              })}
            {renderInputField("Email", "email", "email", {
              required: "Email is required",
              pattern: {
                value: /^[^@ ]+@wright\.edu$/,
                message: "Email must end with @wright.edu",
              },
            })}
            {renderInputField("Password", "password", "password", {
              required: "Password is required",
              minLength: { value: 8, message: "Password must be at least 8 characters" },
              pattern: {
                value:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message:
                  "Password must include uppercase, lowercase, number, and special character",
              },
            })}
          </div>
          <div className="submit-container">
            <input
              type="button"
              className="signupbotton"
              onClick={() => handleActionToggle(action === "login" ? "signup" : "login")}
              value={action === "login" ? "Sign Up" : "Sign In"}
            />
            <input type="submit" className="signupbotton" value={action === "login" ? "Sign In" : "Sign Up"} />
          </div>
        </form>
      </div>
    </div>
  );
};
