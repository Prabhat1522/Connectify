import React, { useContext, useEffect } from "react";
import SideBar from "../components/SideBar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";
import { ChatContext } from "../../contex/ChatContext";

const HomePage = () => {
  const { selectedUser, selectedGroup } = useContext(ChatContext);
  
  const hasActiveChat = !!selectedUser || !!selectedGroup;

  return (
    <div className="w-full h-screen p-0 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center">
      {/* Outer Container with Premium Glassmorphism styling */}
      <div 
        className={`w-full h-full sm:max-w-7xl sm:h-[90vh] glass-panel border border-white/10 sm:rounded-2xl overflow-hidden grid grid-cols-1 relative ${
          hasActiveChat 
            ? "md:grid-cols-[280px_1fr_240px] lg:grid-cols-[320px_1fr_280px]" 
            : "md:grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr]"
        }`}
      >
        <SideBar />
        <ChatContainer />
        <RightSidebar />
      </div>
    </div>
  );
};

export default HomePage;
