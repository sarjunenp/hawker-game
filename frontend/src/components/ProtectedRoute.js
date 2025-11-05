import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    // Check if user has access token
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);
  }, []);

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div style={styles.loading}>
        <p>Checking authentication...</p>
      </div>
    );
  }

  // If not authenticated, redirect to landing page with message
  if (!isAuthenticated) {
    return <Navigate to="/?auth=required" replace />;
  }

  // If authenticated, render the protected content
  return children;
}

const styles = {
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    fontSize: "1.2em",
    color: "#64748b",
  },
};