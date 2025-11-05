import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeCodeForToken } from "./callbackUtils";

export default function Callback() {
  const navigate = useNavigate();
  const hasAttempted = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasAttempted.current) {
      console.log("⏭️ Token exchange already attempted, skipping...");
      return;
    }
    hasAttempted.current = true;

    const handleAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      console.log("📍 Callback URL:", window.location.href);
      console.log("🔑 Auth code:", code ? code.substring(0, 20) + "..." : "Missing");

      if (!code) {
        console.error("❌ No authorization code found in callback URL.");
        alert("Sign in failed: No authorization code received");
        navigate("/");
        return;
      }

      try {
        console.log("🔐 Processing authentication...");
        const tokenData = await exchangeCodeForToken(code);
        
        console.log("✅ Token data received!");
        
        // Store tokens
        localStorage.setItem("id_token", tokenData.id_token);
        localStorage.setItem("access_token", tokenData.access_token);
        if (tokenData.refresh_token) {
          localStorage.setItem("refresh_token", tokenData.refresh_token);
        }

        console.log("✅ Tokens saved! Redirecting to home...");
        
        // Small delay to ensure tokens are saved
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
        
      } catch (error) {
        console.error("❌ Token exchange failed:", error);
        console.error("❌ Error response:", error.response?.data);
        
        const errorMsg = error.response?.data?.error_description || 
                        error.response?.data?.error || 
                        error.message;
        
        alert(`Sign in failed: ${errorMsg}`);
        navigate("/");
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.loader}></div>
      <p style={styles.text}>Logging in...</p>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
  },
  loader: {
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    animation: "spin 1s linear infinite",
  },
  text: {
    marginTop: "20px",
    fontSize: "1.2em",
    color: "#64748b",
  },
};