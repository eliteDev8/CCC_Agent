import {
  FiHome, FiMessageCircle, FiBookOpen, FiLayers, FiGrid, FiUser, FiBox, FiUsers,
  FiShoppingBag, FiBarChart2, FiSettings, FiFileText
} from "react-icons/fi";
import type { IconType } from "react-icons";

export interface SidebarItem {
  label: string;
  icon: IconType;
  to?: string;
  badge?: number;
  badgeColor?: string;
  children?: SidebarItem[];
  role?: string; // Add role property
}

export interface SidebarGroup {
  header: string;
  items: SidebarItem[];
}

export const sidebarConfig: SidebarGroup[] = [
  {
    header: "Main",
    items: [
      { label: "Home", icon: FiHome, to: "/" },
      { label: "Chat", icon: FiMessageCircle, to: "/chat", badge: 0 },
      { label: "Docs", icon: FiBookOpen, to: "/docs" },
      { label: "Data Management", icon: FiBox, to: "/data", role: "admin" },
    ],
  },
  {
    header: "Product",
    items: [
      {
        label: "Product",
        icon: FiBox,
        children: [
          { label: "Overview", icon: FiFileText, to: "/product/overview" },
          { label: "Drafts", icon: FiFileText, to: "/product/drafts", badge: 3 },
          { label: "Released", icon: FiFileText, to: "/product/released" },
          { label: "Comments", icon: FiFileText, to: "/product/comments" },
          { label: "Scheduled", icon: FiFileText, to: "/product/scheduled", badge: 8, badgeColor: "bg-green-200 text-green-800" },
        ],
      },
    ],
  },
  {
    header: "Business",
    items: [
      { label: "Customers", icon: FiUsers, to: "/customers" },
      { label: "Shop", icon: FiShoppingBag, to: "/shop" },
      { label: "Income", icon: FiBarChart2, to: "/income" },
      { label: "Promote", icon: FiSettings, to: "/promote" },
    ],
  },
  {
    header: "Other",
    items: [
      { label: "Components", icon: FiLayers, to: "/components" },
      { label: "Templates", icon: FiGrid, to: "/templates" },
    ],
  },
]; 