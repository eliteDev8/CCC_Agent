import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiChevronDown, FiChevronUp, FiLogOut, FiUser } from "react-icons/fi";
import { sidebarConfig } from "../../config/sidebarConfig";
import type { SidebarItem } from "../../config/sidebarConfig";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/userSlice";
import type { RootState } from "../../store";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);

  const handleMenuToggle = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const renderItem = (item: SidebarItem, depth = 0) => {
    if (item.role && user?.role !== item.role) return null;
    const hasChildren = item.children && item.children.length > 0;
    const isChildActive = hasChildren && item.children!.some(child => location.pathname === child.to);
    const isActive = (item.to && location.pathname === item.to) || isChildActive;
    const isOpen = openMenus[item.label] || false;

  return (
      <React.Fragment key={item.label}>
        <div
          className={`flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors font-medium group
            ${isActive ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-700"}
            ${collapsed ? "justify-center" : ""} ${depth > 0 ? "ml-4" : ""}`}
          onClick={() => hasChildren && handleMenuToggle(item.label)}
          title={collapsed ? item.label : undefined}
        >
          <span style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <item.icon />
          </span>
          {!collapsed && (
            <>
              {item.to ? (
                <NavLink to={item.to} className="flex-1 truncate" end>
                  {item.label}
                </NavLink>
              ) : (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {hasChildren && (
                <span className="ml-auto">
                  {isOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                </span>
              )}
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold
                  ${item.badgeColor || "bg-orange-200 text-orange-800"}`}>
                  {item.badge}
                </span>
              )}
            </>
          )}
        </div>
        {hasChildren && isOpen && !collapsed && (
          <div className="pl-2">
            {item.children!.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="relative h-full">
      {/* Sidebar */}
      <aside
        className={`h-full bg-gray-50 shadow-md flex flex-col transition-all duration-200 border-r border-gray-200
        ${collapsed ? "w-20" : "w-64"}`}
        style={{ minWidth: collapsed ? 80 : 256 }}
      >
        {/* Logo and Site Name */}
        <div className={`flex items-center gap-3 px-2 py-6 border-b border-gray-200 transition-all duration-200 ${collapsed ? "justify-center px-0" : "px-6"}`}>
          <img src="/vite.svg" alt="Logo" className="w-12 h-12 rounded-lg shadow bg-white p-1" />
          {!collapsed && (
            <span className="text-xl font-bold text-gray-800 tracking-tight select-none">CCC AI Chat</span>
          )}
        </div>
        {/* Navigation groups */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {sidebarConfig.map(group => (
            <div key={group.header}>
              {!collapsed && <div className="text-xs text-gray-400 font-semibold px-2 mb-2">{group.header}</div>}
              <ul className="space-y-1">
                {group.items.map(item => (
                  <li key={item.label}>{renderItem(item)}</li>
                ))}
              </ul>
          </div>
          ))}
        </nav>
        <div className={`px-2 py-4 border-t border-gray-200 text-xs text-gray-400 ${collapsed ? "text-center" : ""}`}>
          &copy; {new Date().getFullYear()} CCC AI Chat
      </div>
    </aside>
      {/* Floating Toggle Button */}
      <button
        className="absolute top-1/2 left-full -translate-y-1/2 z-20 bg-white border border-gray-200 rounded-full shadow p-2 hover:bg-gray-100 transition"
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{ marginLeft: -16 }}
      >
        {collapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
      </button>
    </div>
  );
};

export default Sidebar;