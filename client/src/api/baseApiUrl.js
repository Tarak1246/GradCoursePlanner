// src/api/axios.js
import axios from "axios";

const baseApiUrl = "http://localhost:4000/api";

/**
 * @function loginUser
 * @description Logs a user in to the system.
 * @param {object} userData - An object containing login credentials.
 * @returns {Promise<object>} A promise that resolves to the user data on successful login.
 * @throws {Error} If the login request fails.
 */
export const loginUser = async (userData) => {
  try {
    console.warn(userData);
    const response = await axios.post(`${baseApiUrl}/auth/signin`, userData);
    return response.data;
  } catch (error) {
    throw new Error(`Error user login: ${error.message}`);
  }
};
/**
 * @function registerUser
 * @description Registers a new user on the server.
 * @param {object} userData - An object containing user registration details (e.g., username, password, email).
 * @returns {Promise<object>} A promise that resolves to the newly registered user data on success.
 * @throws {Error} If the user registration fails.
 */
export const signupUser = async (userData) => {
  try {
    const response = await axios.post(`${baseApiUrl}/auth/signup`, userData);
    return response.data;
  } catch (error) {
    throw new Error(`Error user register: ${error.message}`);
  }
};

// function to get data for list of course based on area of interest
export const fetchAreaOfInterestData = async (setAreasOfInterest, setError) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await axios.get(`${baseApiUrl}/courses/all`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    setAreasOfInterest(response.data);
    return response.data;
  } catch (error) {
    setError(error.message);
    throw new Error(`Failed to load data`);
  }
};

export const handleCourseClick = async (
  course,
  setSelectedCourse,
  setIsModalOpen,
  setCourseDetails
) => {
  try {
    setSelectedCourse(course);
    setIsModalOpen(true);

    const authToken = localStorage.getItem("jwtToken");
    const response = await axios.post(
      `${baseApiUrl}/courses/filter-courses`,
      { title: course },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    setCourseDetails(response.data);
  } catch (error) {
    console.error(error);
    setCourseDetails({
      error: error.response?.data?.message || error.message,
    });
  }

  
};

export const programData = async () => {
  try {
    const authToken = localStorage.getItem("jwtToken");
    const response = await axios.get(
      `${baseApiUrl}/courses/program-of-study`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(`Error user Program of study: ${error.message}`);
  }
};