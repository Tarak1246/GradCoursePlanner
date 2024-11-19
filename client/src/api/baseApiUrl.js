// src/api/axios.js
import axios from "axios";

const baseApiUrl = axios.create({
  baseURL: "http://localhost:4000/api",
});

export default baseApiUrl;
