import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const username = localStorage.getItem("username");

  if (!username) {
    // Not logged in → redirect to login page
    return <Navigate to="/login" replace />;
  }

  // Logged in → render the page
  return children;
}
