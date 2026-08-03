import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import navigation from "../../config/navigation";
import { useAuth } from "../../context/AuthContext";
import SidebarItem from "./SidebarItem";
import SidebarGroup from "./SidebarGroup";

export default function Sidebar({
  collapsed,
  setCollapsed,
}) {
  const location = useLocation();

  const { user, logout } = useAuth();

  const [openGroups, setOpenGroups] = useState(() => ({
    Organization: true,
  }));

  const fullName = useMemo(() => {
    if (!user) return "";

    return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  }, [user]);

  const primaryRole = useMemo(() => {
  if (!user) return "";

  if (
    Array.isArray(user.roles) &&
    user.roles.length > 0
  ) {
    return user.roles[0]?.role?.name ?? "";
  }

  return "";
}, [user]);

  const toggleGroup = (title) => {
    setOpenGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isGroupActive = (children) => {
    return children.some((child) =>
      location.pathname.startsWith(child.path)
    );
  };

  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return roleNames.some(
      (r) =>
        r &&
        (r === "SUPER_ADMIN" ||
          r === "Super Admin" ||
          r === "Admin" ||
          r.toLowerCase().includes("super") ||
          (r.toLowerCase().includes("admin") && !r.toLowerCase().includes("company")))
    );
  }, [user]);

  const isSalesManager = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("sales manager"));
  }, [user]);

  const isSalesExecutive = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return roleNames.some(
      (r) => r && (r.toLowerCase().includes("sales executive") || r.toLowerCase().includes("sales person"))
    );
  }, [user]);


  const isHeadOfSales = useMemo(() => {
    if (!user) return false;
    const roleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === "string" ? r : r.role?.name || r.name))
      : [user.role?.name || ""];
    return roleNames.some((r) => r && r.toLowerCase().includes("head of sales"));
  }, [user]);

  const filteredNavigation = useMemo(() => {
    if (isSuperAdmin) {
      return navigation
        .filter((item) => item.title !== "Team Management")
        .map((item) => {
          if (item.title === "Field Force") {
            return {
              title: "Field Force",
              icon: item.icon,
              path: "/field-force/dashboard",
            };
          }
          return item;
        });
    }

    if (isHeadOfSales) {
      return navigation.filter(
        (item) => !["Field Force", "Team Management"].includes(item.title)
      );
    }

    if (isSalesExecutive) {
      return navigation
        .filter(
          (item) => !["Organization", "Team Management", "Sales Orders"].includes(item.title)
        )
        .map((item) => {
          if (item.title === "Field Force" && Array.isArray(item.children)) {
            return {
              ...item,
children: item.children.filter(
                (child) =>
                  !["Attendance", "Beat Plans", "Beat Plan", "Route", "Photos", "Meeting Notes", "Expenses", "Calendar"].includes(child.title)
              ),
            };
          }
          return item;
        });
    }

    if (isSalesManager) {
      return navigation
        .filter((item) => item.title !== "Field Force")
        .map((item) => {
          if (item.title === "Organization" && Array.isArray(item.children)) {
            return {
              ...item,
              children: item.children.filter(
                (child) =>
                  !["/organization/company", "/organization/branch", "/organization/department"].includes(child.path)
              ),
            };
          }
          return item;
        });
    }

    return navigation;
  }, [isSuperAdmin, isHeadOfSales, isSalesManager, isSalesExecutive]);



  return (
    <aside
      className={`h-screen sticky top-0 transition-all duration-300 border-r border-slate-200 bg-white shadow-sm flex flex-col ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Logo */}

      <div className="h-20 border-b border-slate-200 flex items-center justify-between px-5">

        {!collapsed && (

          <Link
            to="/dashboard"
            className="flex flex-col"
          >

            <span className="text-2xl font-bold text-blue-600">

              IT360

            </span>

            <span className="text-xs text-slate-500">

              Sales Force Automation

            </span>

          </Link>

        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-2 hover:bg-slate-100 transition"
        >
          {collapsed ? (
            <PanelLeftOpen size={20} />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </button>

      </div>

      {/* Navigation */}

      <div className="flex-1 overflow-y-auto px-3 py-5">

        <nav className="space-y-2">

          {filteredNavigation.map((item) => {

            if (item.children) {

              return (
                <SidebarGroup
                  key={item.title}
                  item={item}
                  collapsed={collapsed}
                  open={openGroups[item.title]}
                  active={isGroupActive(item.children)}
                  toggle={() =>
                    toggleGroup(item.title)
                  }
                />
              );

            }

            return (
              <SidebarItem
                key={item.title}
                item={item}
                collapsed={collapsed}
              />
            );

          })}

        </nav>

      </div>


            {/* User */}

      <div className="border-t border-slate-200 p-4">

        {!collapsed ? (

          <>

            <div className="flex items-center gap-3">

              <div className="h-11 w-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">

                {fullName
                  ? fullName.charAt(0)
                  : "U"}

              </div>

              <div className="flex-1">

                <p className="font-semibold text-sm">

                  {fullName || "User"}

                </p>

                <p className="text-xs text-slate-500">

                  {primaryRole}

                </p>

              </div>

            </div>

            <button
              onClick={logout}
              className="mt-5 w-full rounded-xl border border-slate-200 py-2 flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition"
            >

              <LogOut size={18} />

              Logout

            </button>

          </>

        ) : (

          <button
            onClick={logout}
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-full hover:bg-red-50 hover:text-red-600 transition"
          >

            <LogOut size={20} />

          </button>

        )}

      </div>

    </aside>
  );
}