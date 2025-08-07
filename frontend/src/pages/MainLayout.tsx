import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Navbar from "../components/Header/Header";
import { Outlet, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchChatHistory } from "../store/chatSlice";

const MD_BREAKPOINT = 768; // Tailwind's md

const MainLayout: React.FC = () => {
  const dispatch = useDispatch<any>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < MD_BREAKPOINT);
  const location = useLocation();

  useEffect(() => {
    // Only fetch chat history if on /chat
    if (location.pathname === "/chat") {
      dispatch(fetchChatHistory());
    }
  }, [dispatch, location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < MD_BREAKPOINT) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    window.addEventListener("resize", handleResize);
    // Set initial state
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} />
      <div className="flex-1 flex flex-col bg-gray-50 min-h-0">
        <Navbar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 