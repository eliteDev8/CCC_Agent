import React, { useEffect, useState } from "react";
import Header from "../components/Header/Header";
import Sidebar from "../components/Sidebar/Sidebar";
import ChatBox from "../components/ChatBox/ChatBox";
import { useDispatch } from "react-redux";
import { fetchChatHistory } from "../store/chatSlice";

const ChatPage: React.FC = () => {
  const dispatch = useDispatch<any>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchChatHistory());
  }, [dispatch]);

  // Sidebar is always open on md+ screens, toggled on mobile
  return (
    <div className="flex flex-col h-screen">
      <Header onSidebarToggle={() => setSidebarOpen(true)} />
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 flex flex-col">
          <ChatBox />
        </main>
      </div>
    </div>
  );
};

export default ChatPage;