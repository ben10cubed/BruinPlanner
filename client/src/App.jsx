import React, { useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import MainPage from "./pages/MainPage.jsx";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("login");

  return page === "login"
    ? <LoginPage onLogin={() => setPage("main")} />
    : <MainPage onLogout={() => setPage("login")} />;
}
