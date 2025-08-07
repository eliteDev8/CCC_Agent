import React, { useState } from "react";
import { FiSearch, FiBell, FiChevronDown, FiUser } from "react-icons/fi";
import { useDispatch } from "react-redux";
import { logout } from "../../store/userSlice";

const Navbar: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dispatch = useDispatch();
  // Example user info
  const user = { email: "admin@example.com", name: "Admin" };

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-sm flex items-center h-16 px-4 md:px-8">
      {/* Search bar */}
      <div className="flex-1 flex items-center">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-3 py-1.5 rounded bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm w-full"
          />
          <FiSearch className="absolute left-2 top-2.5 text-gray-400 w-4 h-4" />
        </div>
      </div>
      {/* Notification bell */}
      <button className="relative ml-4 p-2 rounded hover:bg-gray-100 text-gray-700" aria-label="Notifications">
        <FiBell className="w-6 h-6" />
        {/* Badge placeholder */}
        <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold" style={{ fontSize: 10, display: 'none' }}>3</span>
      </button>
      {/* User avatar and dropdown */}
      <div className="relative ml-4">
        <button
          className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 text-gray-700 focus:outline-none"
          onClick={() => setDropdownOpen((open) => !open)}
        >
          <span className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-lg font-bold text-blue-700">
            {user.name[0]}
          </span>
          <span className="hidden md:block font-medium">{user.name}</span>
          <FiChevronDown className="w-4 h-4" />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg py-2 z-40 animate-fade-in">
            <div className="px-4 py-2 text-gray-700 text-sm">{user.email}</div>
            <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={() => {/* TODO: profile update */}}>
              Profile
            </button>
            <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50" onClick={() => dispatch(logout())}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar; 