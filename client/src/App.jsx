import React, { useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import MainPage from "./pages/MainPage.jsx";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("login");
  const [userID, setUserID] = useState(null);

  function handleLogin(id) {
    setUserID(id);
    setPage("main");
  }

  function handleLogout() {
    setUserID(null);   // clear userID
    setPage("login");  // go back to login page
  }

  return page === "login"
    ? <LoginPage onLogin={handleLogin} />
    : <MainPage userID={userID} onLogout={handleLogout} />;
}
