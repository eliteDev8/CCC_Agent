import React from "react";

const HomePage: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <h1 className="text-4xl font-bold text-blue-700 mb-4">Welcome to CCC AI Chat</h1>
    <p className="text-lg text-gray-600 mb-6 max-w-xl">
      Your all-in-one AI chat platform with file management, documentation, and more. Use the sidebar to navigate between chat, data management, and other features.
    </p>
    <div className="flex gap-4 mt-4">
      <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">AI Chat</span>
      <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">Google Drive Integration</span>
      <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">Docs & More</span>
    </div>
  </div>
);

export default HomePage; 