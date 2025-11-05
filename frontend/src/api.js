import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE,
});

// Add token to every request
api.interceptors.request.use(
  (config) => {
    // CRITICAL: Use id_token for API Gateway JWT authorizer
    const token = localStorage.getItem("access_token");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔑 Sending ID token");
    } else {
      console.warn("⚠️ No id_token found!");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;