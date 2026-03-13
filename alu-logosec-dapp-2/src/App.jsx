import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import VerifyPage from "./pages/VerifyPage";
import DashboardPage from "./pages/DashboardPage";
import "./styles/global.css";

export default function App() {
  const [page, setPage] = useState("home");
  const wallet = useWallet();

  const navigate = (p) => setPage(p);

  const pages = {
    home: <HomePage navigate={navigate} wallet={wallet} />,
    register: <RegisterPage wallet={wallet} />,
    verify: <VerifyPage wallet={wallet} />,
    dashboard: <DashboardPage wallet={wallet} />,
  };

  return (
    <div className="app">
      <Navbar wallet={wallet} navigate={navigate} currentPage={page} />
      <main className="main-content">{pages[page] || pages.home}</main>
    </div>
  );
}
