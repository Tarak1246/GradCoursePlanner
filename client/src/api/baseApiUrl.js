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

    return response;
  } catch (error) {
    throw new Error(`Error user login: ${error.response.data.message}`);
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

    return response;
  } catch (error) {
    throw new Error(`Error user register: ${error.response.data.message}`);
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
  setIsModalOpen,
  setCourseDetails
) => {
  try {
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
    setCourseDetails({
      error: error.response?.data?.message || error.message,
    });
  }
};

export const programData = async () => {
  try {
    const authToken = localStorage.getItem("jwtToken");
    const response = await axios.get(`${baseApiUrl}/courses/program-of-study`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Error user Program of study: ${error.message}`);
  }
};

export const getFilterCoursesData = async (
  setIsSearching,
  setError,
  filters,
  setCourses,
  setShowSubject
) => {
  const authToken = localStorage.getItem("jwtToken");

  try {
    setIsSearching(true);
    setError("");

    const requestBody = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value.length > 0) {
        acc[key] = value;
      }
      return acc;
    }, {});

    const response = await axios.post(
      `${baseApiUrl}/courses/filter-courses`,
      requestBody,

      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    setCourses(response?.data?.values);
    setShowSubject(true);
  } catch (error) {
    setError(error.response?.data?.message || error.message);
  } finally {
    setIsSearching(false);
  }
};

export const fetchEnumValues = async (
  setIsLoading,
  setEnumValues,
  setFilters,
  setError
) => {
  try {
    setIsLoading(true);
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await axios.get(`${baseApiUrl}/courses/enum-values`, {
      headers: { Authorization: `Bearer ${jwtToken}` },
    });

    const values = response.data.values;
    const staticValues = {
      ...values,
      year: ["2024", "2025", "2026"],
    };

    const initialFilters = Object.keys(staticValues).reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {});

    setEnumValues(staticValues);
    setFilters(initialFilters);
  } catch {
    setError("Failed to load filter options. Please try again later.");
  } finally {
    setIsLoading(false);
  }
};

export const fetchCourseRegistrationApi = async (
  selectedSubjects,
  setMultiALertMessage,
  showAlert,
  setSelectedSubjects
) => {
  const jwtToken = localStorage.getItem("jwtToken");

  try {
    const response = await axios.post(
      `${baseApiUrl}/courses/register-courses`,
      {
        courseIds: selectedSubjects?.map((subject) => subject.id),
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    setMultiALertMessage(response?.data);

    setTimeout(() => {
      setMultiALertMessage({});
      setSelectedSubjects([]);
    }, 6000);
  } catch (error) {
    showAlert(error.response?.data?.message || error.message, "destructive");
  }
};

export const checkIsFirstSemesterApi = async (
  setIsFirstSemesterResponse,
  filters
) => {
  const jwtToken = localStorage.getItem("jwtToken");

  const response = await axios.post(
    ` ${baseApiUrl}/courses/is-first-semester`,
    {
      semester: filters?.semester[0],
      year: filters?.year[0],
    },

    {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    }
  );

  setIsFirstSemesterResponse(response);
};

export const checkSubjectEligibility = async (
  subjectId,
  toggleDialog,
  subjects
) => {
  const jwtToken = localStorage.getItem("jwtToken");

  try {
    const response = await axios.get(
      `${baseApiUrl}/subject-details/${subjectId}`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    const data = response.data;

    const hasEligibleCertificate = data?.certificateEligibility?.some(
      (certification) => certification.eligible
    );

    if (data.courseCheck && data.courseCheck.isValid === false) {
      toggleDialog("error", true, { message: data.courseCheck.message });
      return false;
    } else if (
      data.courseCheck &&
      data.courseCheck.isValid &&
      data.prerequisites &&
      data.prerequisites.eligible === false
    ) {
      toggleDialog("prereqConfirm", true, {
        message: `Have you completed these prerequisites: ${data.prerequisites.unmetPrerequisites.join(
          ", "
        )}?`,
        subject: subjects.find((s) => s.id === subjectId),
        certificates: data.certificateEligibility,
      });
      return false;
    } else if (
      data.courseCheck &&
      data.courseCheck.isValid &&
      data.prerequisites &&
      data.prerequisites.eligible &&
      hasEligibleCertificate &&
      data.certificateEligibility.length > 0
    ) {
      toggleDialog("certificate", true, {
        certificates: data.certificateEligibility,
      });
    }

    return true;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      "Failed to verify subject eligibility. Please try again.";
    toggleDialog("error", true, { message: errorMessage });
    return false;
  }
};

export const updateCourseGrade = async (courseData) => {
  const jwtToken = localStorage.getItem("jwtToken");
  try {
    const response = await axios.put(
      `${baseApiUrl}/courses/update-course-completion`,
      courseData, // Body of the request
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    return response;
  } catch (error) {
    throw new Error(
      `Error Course updation: ${error.response?.data?.message || error.message}`
    );
  }
};

export const deleteCourse = async (courseId) => {
  const jwtToken = localStorage.getItem("jwtToken");
  try {
    const response = await axios.delete(`${baseApiUrl}/courses/${courseId}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    return response;
  } catch (error) {
    throw new Error(
      `Error Course updation: ${error.response?.data?.message || error.message}`
    );
  }
};
