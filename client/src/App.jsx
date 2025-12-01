import React, { useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import MainPage from "./pages/MainPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
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
  if (page === "signup"){
    return <SignupPage onSignup={() => setPage("login")} onLoginPage={() => setPage("login")} />
  }
  else if (page === "login"){
    return <LoginPage onLogin={handleLogin} onSignupPage={() => setPage("signup")}/>
  }
  else{
    return <MainPage userID={userID} onLogout={handleLogout} />;
  }
}
