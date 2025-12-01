import React, { useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import MainPage from "./pages/MainPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("login");
  if (page === "signup"){
    return <SignupPage onSignup={() => setPage("login")} onLoginPage={() => setPage("login")} />
  }
  else if (page === "login"){
    return <LoginPage onLogin={() => setPage("main")} onSignupPage={() => setPage("signup")}/>
  }
  else{
    return <MainPage onLogout={() => setPage("login")} />;
  }
}
