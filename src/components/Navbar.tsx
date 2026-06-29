import React, { useState, useEffect } from "react";
import { BookOpen, Award, Users, ShieldAlert, User, LogOut, Globe, FileText, Mic, Menu, X, Check, Flame, GraduationCap, Sparkles, ChevronLeft, ChevronRight, Cloud, CloudOff, Database, Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile } from "../types";
import { EFCLogo } from "./EFCLogo";

interface NavbarProps {
  user: UserProfile | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  logoUrl?: string;
  onOpenStory?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenAuth,
  logoUrl = "",
  onOpenStory
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Connection / Sync / Sandbox state
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [showStatusDetail, setShowStatusDetail] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const isDemoSandbox = user?.userId?.startsWith("demo_");
  const isOffline = !isOnline || simulatedOffline;
  const isWorkingInSandbox = isDemoSandbox || isOffline;

  // Collapse state persisted in localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("efc_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const newVal = !prev;
      try {
        localStorage.setItem("efc_sidebar_collapsed", String(newVal));
      } catch (err) {
        console.warn("Failed to save sidebar collapsed state:", err);
      }
      return newVal;
    });
  };

  const handleMobileNavClick = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // Shared function to get tab button styles for sidebar
  const getSidebarBtnClass = (tab: string) => {
    const isActive = activeTab === tab;
    return `w-full flex items-center ${
      isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
    } rounded-xl text-xs font-extrabold tracking-wide transition-all border cursor-pointer ${
      isActive
        ? "bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-100"
        : "text-slate-600 hover:bg-slate-50 border-transparent"
    }`;
  };

  return (
    <>
      {/* ========================================================= */}
      {/* DESKTOP SIDEBAR LAYOUT (lg:flex, hidden on mobile/tablet) */}
      {/* ========================================================= */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 left-0 bg-white border-r border-slate-100 shrink-0 z-40 justify-between shadow-[2px_0_12px_rgba(15,23,42,0.02)] transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64 lg:w-72"
        }`}
      >
        {/* Brand Logo & Toggle */}
        <div className={`p-4 border-b border-slate-100 flex ${isCollapsed ? "flex-col items-center gap-3" : "items-center justify-between"} gap-2`}>
          <button
            onClick={() => setActiveTab("landing")}
            className="flex items-center gap-2.5 transition hover:opacity-90 self-start"
            title="Campaign Home"
          >
            {isCollapsed ? (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs tracking-tighter shadow-sm">
                EFC
              </div>
            ) : logoUrl ? (
              <div className="flex h-11 items-center justify-center rounded-xl overflow-hidden p-1 bg-white border border-slate-100 sleek-shadow">
                <img
                  src={logoUrl}
                  alt="Campaign Logo"
                  className="h-9 max-w-[140px] object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <EFCLogo showOnlyWordmark={true} />
            )}
          </button>

          {/* Collapse Toggle Button */}
          <button
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-650 rounded-lg transition border border-transparent hover:border-slate-150 cursor-pointer flex items-center justify-center"
          >
            {isCollapsed ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
          </button>
        </div>

        {/* Database Live Sync indicator below logo, or compact badge if collapsed */}
        <div className={`px-4 py-2 border-b border-slate-50 flex ${isCollapsed ? "justify-center px-1" : "flex-col gap-1"}`}>
          <button
            onClick={() => setShowStatusDetail(!showStatusDetail)}
            className={`w-full flex ${isCollapsed ? "justify-center" : "items-center justify-between"} gap-2 p-2 rounded-xl transition cursor-pointer text-left ${
              isWorkingInSandbox 
                ? "bg-amber-50/70 border border-amber-100 hover:bg-amber-100/50" 
                : "bg-emerald-50/70 border border-emerald-100 hover:bg-emerald-100/50"
            }`}
            title="Click to view database synchronization status details"
          >
            {!isCollapsed ? (
              <>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${isWorkingInSandbox ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isWorkingInSandbox ? "text-amber-800" : "text-emerald-800"}`}>
                    {isWorkingInSandbox ? "Offline Sandbox" : "Cloud Synced"}
                  </span>
                </div>
                {isWorkingInSandbox ? (
                  <CloudOff className="h-3.5 w-3.5 text-amber-500" />
                ) : (
                  <Cloud className="h-3.5 w-3.5 text-emerald-500" />
                )}
              </>
            ) : (
              <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${isWorkingInSandbox ? "bg-amber-100/50" : "bg-emerald-100/50"}`} title={isWorkingInSandbox ? "Offline Sandbox" : "Cloud Synced"}>
                <div className={`h-2 w-2 rounded-full ${isWorkingInSandbox ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
              </div>
            )}
          </button>
        </div>

        {/* Navigation Menu Links */}
        <div className={`flex-1 overflow-y-auto px-4 py-6 space-y-1.5 ${isCollapsed ? "flex flex-col items-center !px-2" : ""}`}>
          {!isCollapsed && (
            <span className="block px-4 text-[9px] font-extrabold tracking-widest text-slate-400 uppercase mb-3">
              Navigation Menu
            </span>
          )}

          <button
            onClick={() => setActiveTab("landing")}
            className={getSidebarBtnClass("landing")}
            title="Campaign Home"
          >
            <Globe className="h-4.5 w-4.5 shrink-0" />
            {!isCollapsed && <span>Campaign Home</span>}
          </button>

          <button
            onClick={onOpenStory}
            className={`w-full flex items-center ${isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"} rounded-xl text-xs font-extrabold tracking-wide text-slate-600 hover:bg-slate-50 border border-transparent transition-all cursor-pointer`}
            title="Our Story"
          >
            <span className="text-sm shrink-0">📖</span>
            {!isCollapsed && <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-extrabold">Our Story</span>}
          </button>

          <button
            onClick={() => setActiveTab("learning")}
            className={getSidebarBtnClass("learning")}
            title="Learning Hub"
          >
            <BookOpen className="h-4.5 w-4.5 shrink-0" />
            {!isCollapsed && <span>Learning Hub</span>}
          </button>

          <button
            onClick={() => setActiveTab("practice")}
            className={getSidebarBtnClass("practice")}
            title="Practice Arena"
          >
            <Mic className="h-4.5 w-4.5 shrink-0" />
            {!isCollapsed && <span>Practice Arena</span>}
          </button>

          <button
            onClick={() => setActiveTab("community")}
            className={getSidebarBtnClass("community")}
            title="Community & Debates"
          >
            <Users className="h-4.5 w-4.5 shrink-0" />
            {!isCollapsed && <span>Community & Debates</span>}
          </button>

          {user && user.role === "admin" && (
            <div className={`pt-4 border-t border-slate-50 mt-4 space-y-1 ${isCollapsed ? "w-full flex flex-col items-center pt-3" : ""}`}>
              {!isCollapsed && (
                <span className="block px-4 text-[9px] font-extrabold tracking-widest text-slate-400 uppercase mb-2">
                  Faculty Portal
                </span>
              )}
              <button
                onClick={() => setActiveTab("admin")}
                className={`w-full flex items-center ${isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"} rounded-xl text-xs font-extrabold tracking-wide transition-all border cursor-pointer ${
                  activeTab === "admin"
                    ? "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-100"
                    : "text-amber-700 bg-amber-50/45 hover:bg-amber-50 border-transparent"
                }`}
                title="Admin Panel"
              >
                <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                {!isCollapsed && <span>Admin Panel</span>}
              </button>
            </div>
          )}

          {user && user.role === "teacher" && (
            <div className={`pt-4 border-t border-slate-50 mt-4 space-y-1 ${isCollapsed ? "w-full flex flex-col items-center pt-3" : ""}`}>
              {!isCollapsed && (
                <span className="block px-4 text-[9px] font-extrabold tracking-widest text-slate-400 uppercase mb-2">
                  Faculty Portal
                </span>
              )}
              <button
                onClick={() => setActiveTab("teacher")}
                className={`w-full flex items-center ${isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"} rounded-xl text-xs font-extrabold tracking-wide transition-all border cursor-pointer ${
                  activeTab === "teacher"
                    ? "bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-100"
                    : "text-indigo-700 bg-indigo-50/45 hover:bg-indigo-50 border-transparent"
                }`}
                title="Teacher Panel"
              >
                <GraduationCap className="h-4.5 w-4.5 shrink-0" />
                {!isCollapsed && <span>Teacher Panel</span>}
              </button>
            </div>
          )}
        </div>

        {/* User Account Widget (Bottom of Sidebar) */}
        <div className={`p-4 border-t border-slate-100 bg-slate-50/50 space-y-3 ${isCollapsed ? "!p-2 flex flex-col items-center" : ""}`}>
          {user ? (
            <div className={`space-y-3 w-full ${isCollapsed ? "flex flex-col items-center gap-1.5 space-y-0" : ""}`}>
              {/* Daily Streak Indicator */}
              {isCollapsed ? (
                <div 
                  className="flex flex-col items-center gap-1.5 border border-slate-150 bg-white rounded-2xl p-2 w-full shadow-xs cursor-help"
                  title={`${user.streak || 0} Day Streak (Completed: ${user.dailyTasksCompleted?.speaking ? "Speaking " : ""}${user.dailyTasksCompleted?.writing ? "Writing " : ""}${user.dailyTasksCompleted?.vocabulary ? "Vocabulary" : ""})`}
                >
                  <div className="relative">
                    <Flame className="h-5 w-5 text-orange-600 fill-orange-500 animate-pulse" />
                    <span className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white font-extrabold text-[8px] h-3.5 w-3.5 rounded-full flex items-center justify-center">
                      {user.streak || 0}
                    </span>
                  </div>
                  {/* Miniature tasks status badges */}
                  <div className="flex flex-col gap-0.5 mt-1">
                    <span className={`h-3.5 w-3.5 rounded-full flex items-center justify-center text-[6px] font-black border ${user.dailyTasksCompleted?.speaking ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-450 border-slate-200"}`}>S</span>
                    <span className={`h-3.5 w-3.5 rounded-full flex items-center justify-center text-[6px] font-black border ${user.dailyTasksCompleted?.writing ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-450 border-slate-200"}`}>W</span>
                    <span className={`h-3.5 w-3.5 rounded-full flex items-center justify-center text-[6px] font-black border ${user.dailyTasksCompleted?.vocabulary ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-450 border-slate-200"}`}>V</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between border border-slate-150 bg-white rounded-2xl px-3.5 py-2.5 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-orange-600 fill-orange-500 animate-pulse" />
                    <span className="text-[11px] font-extrabold text-slate-700">{user.streak || 0} Day Streak</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Speaking status */}
                    <span
                      className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[8px] font-extrabold border ${
                        user.dailyTasksCompleted?.speaking
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                          : "bg-white text-slate-450 border-slate-200"
                      }`}
                      title="Speaking task completed"
                    >
                      S
                    </span>
                    {/* Writing status */}
                    <span
                      className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[8px] font-extrabold border ${
                        user.dailyTasksCompleted?.writing
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                          : "bg-white text-slate-450 border-slate-200"
                      }`}
                      title="Writing task completed"
                    >
                      W
                    </span>
                    {/* Vocab status */}
                    <span
                      className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[8px] font-extrabold border ${
                        user.dailyTasksCompleted?.vocabulary
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                          : "bg-white text-slate-450 border-slate-200"
                      }`}
                      title="Vocabulary quiz completed"
                    >
                      V
                    </span>
                  </div>
                </div>
              )}

              {/* Profile Card Summary */}
              {isCollapsed ? (
                <div className="flex flex-col items-center gap-2 w-full mt-1">
                  <button
                    onClick={() => setActiveTab("profile")}
                    title={`View Profile: ${user.name}`}
                    className={`relative shrink-0 flex h-11 w-11 items-center justify-center rounded-full p-[2px] transition ${
                      activeTab === "profile" ? "ring-2 ring-blue-600 ring-offset-2" : "ring-1 ring-slate-200"
                    }`}
                  >
                    <div className="h-full w-full rounded-full bg-gradient-to-tr from-blue-600 via-orange-500 to-purple-600 p-[1.5px]">
                      {user.imageUrl ? (
                        <div className="h-full w-full rounded-full overflow-hidden border border-white bg-white">
                          <img
                            src={user.imageUrl}
                            alt={user.name}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-[11px] font-extrabold text-blue-800 uppercase tracking-wider">
                          {user.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Logout Button (Only if on profile tab) */}
                  {activeTab === "profile" && (
                    <button
                      onClick={onLogout}
                      title="Log Out of Campaign"
                      className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition border border-rose-200 cursor-pointer w-10 h-10 flex items-center justify-center shadow-xs"
                    >
                      <LogOut className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-slate-100 w-full">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`relative shrink-0 flex h-10 w-10 items-center justify-center rounded-full p-[2px] transition ${
                      activeTab === "profile" ? "ring-2 ring-blue-600 ring-offset-2" : "ring-1 ring-slate-200"
                    }`}
                  >
                    <div className="h-full w-full rounded-full bg-gradient-to-tr from-blue-600 via-orange-500 to-purple-600 p-[1.5px]">
                      {user.imageUrl ? (
                        <div className="h-full w-full rounded-full overflow-hidden border border-white bg-white">
                          <img
                            src={user.imageUrl}
                            alt={user.name}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-[11px] font-extrabold text-blue-800 uppercase tracking-wider">
                          {user.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                        </div>
                      )}
                    </div>
                  </button>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-extrabold text-slate-800 truncate leading-none">
                      {user.name}
                    </h4>
                    <p className="text-[10px] text-slate-450 font-bold truncate mt-1">
                      {user.level} Level • {user.xp} XP
                    </p>
                  </div>

                  {/* Logout Button (Only if on profile tab) */}
                  {activeTab === "profile" && (
                    <button
                      onClick={onLogout}
                      title="Log Out of Campaign"
                      className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition border border-transparent hover:border-rose-100 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              title="Sign In / Register"
              className={`w-full flex items-center justify-center ${isCollapsed ? "p-3 h-11 w-11 rounded-full" : "gap-2 rounded-2xl px-4 py-3"} bg-slate-900 hover:bg-slate-850 text-xs font-extrabold text-white shadow-md transition active:scale-95 cursor-pointer`}
            >
              <User className="h-4 w-4" />
              {!isCollapsed && <span>Sign In / Register</span>}
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MOBILE COMPACT TOP BAR (lg:hidden, hidden on desktop)     */}
      {/* ========================================================= */}
      <header className="lg:hidden sticky top-0 z-40 w-full border-b border-slate-100 bg-white/95 backdrop-blur h-16 flex items-center justify-between px-4">
        {/* Left: Sidebar Toggle Button and Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title="Toggle Sidebar Menu"
            className="p-2 hover:bg-slate-50 text-slate-550 hover:text-slate-800 rounded-xl transition border border-slate-150 flex items-center justify-center cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            onClick={() => setActiveTab("landing")}
            className="flex items-center gap-2 transition hover:opacity-90"
          >
            {logoUrl ? (
              <div className="flex h-9 items-center justify-center rounded-xl overflow-hidden p-1 bg-white border border-slate-100 sleek-shadow">
                <img
                  src={logoUrl}
                  alt="Campaign Logo"
                  className="h-7 max-w-[100px] object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <EFCLogo showOnlyWordmark={true} />
            )}
          </button>
        </div>

        {/* Compact Right Side Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile compact connection status indicator */}
          <button
            onClick={() => setShowStatusDetail(true)}
            className={`flex items-center gap-1 border rounded-full px-2 py-0.5 text-[10px] font-extrabold cursor-pointer transition shrink-0 ${
              isWorkingInSandbox 
                ? "border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100/50" 
                : "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/50"
            }`}
            title="Click to view database sync status"
          >
            <div className={`h-1.5 w-1.5 rounded-full ${isWorkingInSandbox ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
            <span>{isWorkingInSandbox ? "Sandbox" : "Synced"}</span>
          </button>

          {user ? (
            <>
              {/* Mobile compact streak */}
              <div className="flex items-center gap-1 border border-orange-100 bg-orange-50/70 rounded-full px-2.5 py-1 text-[11px] font-bold text-orange-700">
                <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-600 animate-pulse" />
                <span>{user.streak || 0}</span>
              </div>

              {/* Avatar to Profile */}
              <button
                onClick={() => setActiveTab("profile")}
                className={`relative flex h-8 w-8 items-center justify-center rounded-full p-[1px] transition ${
                  activeTab === "profile" ? "ring-2 ring-blue-600" : "ring-1 ring-slate-200"
                }`}
              >
                <div className="h-full w-full rounded-full bg-gradient-to-tr from-blue-600 via-orange-500 to-purple-600 p-[1px]">
                  {user.imageUrl ? (
                    <div className="h-full w-full rounded-full overflow-hidden border border-white bg-white">
                      <img
                        src={user.imageUrl}
                        alt={user.name}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-[9px] font-extrabold text-blue-800 uppercase tracking-wider">
                      {user.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                    </div>
                  )}
                </div>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="rounded-xl bg-slate-900 p-2 text-white shadow-xs"
            >
              <User className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* ========================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (lg:hidden)                  */}
      {/* ========================================================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-150 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <div className="flex h-16 items-center justify-around px-2">
          <button
            onClick={() => handleMobileNavClick("landing")}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-800 transition ${
              activeTab === "landing" ? "text-blue-600 font-extrabold" : ""
            }`}
          >
            <Globe className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-bold leading-none">Home</span>
          </button>

          <button
            onClick={() => handleMobileNavClick("learning")}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-800 transition ${
              activeTab === "learning" ? "text-blue-600 font-extrabold" : ""
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-bold leading-none">Learn</span>
          </button>

          <button
            onClick={() => handleMobileNavClick("practice")}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-800 transition ${
              activeTab === "practice" ? "text-blue-600 font-extrabold" : ""
            }`}
          >
            <Mic className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-bold leading-none">Practice</span>
          </button>

          <button
            onClick={() => handleMobileNavClick("community")}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-800 transition ${
              activeTab === "community" ? "text-blue-600 font-extrabold" : ""
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-bold leading-none">Forum</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-800 transition ${
              isMobileMenuOpen ? "text-blue-600 font-extrabold" : ""
            }`}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-bold leading-none">Menu</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE POPUP DRAWER MENU                                  */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-xs cursor-pointer"
            />

            {/* Side drawer panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 max-w-xs w-full bg-white z-50 p-6 flex flex-col space-y-6 shadow-2xl border-l border-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Menu Options
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User profile card inside drawer */}
              {user ? (
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-3 font-sans">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs uppercase">
                      {user.name.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 truncate max-w-[150px]">
                        {user.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold truncate max-w-[150px]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-200">
                    <div className="bg-white rounded-lg p-1.5 border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">Level</span>
                      <span className="text-xs font-extrabold text-blue-600 leading-none">{user.level}</span>
                    </div>
                    <div className="bg-white rounded-lg p-1.5 border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">XP</span>
                      <span className="text-xs font-extrabold text-orange-600 leading-none">{user.xp} XP</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <p className="text-xs text-slate-400 font-bold">You are currently offline</p>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 cursor-pointer"
                  >
                    <User className="h-3.5 w-3.5" />
                    Sign In / Register
                  </button>
                </div>
              )}

              {/* Navigation list inside drawer */}
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1">
                <span className="block text-[9px] font-extrabold tracking-widest text-slate-400 uppercase px-3 mb-1">Core Actions</span>
                <button
                  onClick={() => handleMobileNavClick("landing")}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition text-left ${
                    activeTab === "landing"
                      ? "bg-blue-50 text-blue-600 border border-blue-100"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Globe className="h-4 w-4 text-slate-400" />
                  <span>Campaign Home</span>
                </button>

                <button
                  onClick={() => handleMobileNavClick("learning")}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition text-left ${
                    activeTab === "learning"
                      ? "bg-blue-50 text-blue-600 border border-blue-100"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <BookOpen className="h-4 w-4 text-slate-400" />
                  <span>Learning Hub</span>
                </button>

                <button
                  onClick={() => handleMobileNavClick("practice")}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition text-left ${
                    activeTab === "practice"
                      ? "bg-blue-50 text-blue-600 border border-blue-100"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Mic className="h-4 w-4 text-slate-400" />
                  <span>Practice Arena</span>
                </button>

                <button
                  onClick={() => handleMobileNavClick("community")}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition text-left ${
                    activeTab === "community"
                      ? "bg-blue-50 text-blue-600 border border-blue-100"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Users className="h-4 w-4 text-slate-400" />
                  <span>Community & Debates</span>
                </button>

                <div className="h-px bg-slate-100 my-2" />

                <span className="block text-[9px] font-extrabold tracking-widest text-slate-400 uppercase px-3 mb-1">More Options</span>
                <button
                  onClick={() => handleMobileNavClick("profile")}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition text-left ${
                    activeTab === "profile"
                      ? "bg-blue-50 text-blue-600 border border-blue-100"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <User className="h-4 w-4 text-slate-400" />
                  <span>My Profile Progress</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onOpenStory) onOpenStory();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition text-left text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <span className="text-sm shrink-0">📖</span>
                  <span className="bg-gradient-to-r from-blue-600 via-orange-500 to-purple-600 bg-clip-text text-transparent font-extrabold">Our Founders' Story</span>
                </button>

                {user && user.role === "admin" && (
                  <button
                    onClick={() => handleMobileNavClick("admin")}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition text-left ${
                      activeTab === "admin"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    <span>Admin Panel Portal</span>
                  </button>
                )}

                {user && user.role === "teacher" && (
                  <button
                    onClick={() => handleMobileNavClick("teacher")}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition text-left ${
                      activeTab === "teacher"
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <GraduationCap className="h-4 w-4 text-indigo-500" />
                    <span>Teacher Panel Portal</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowStatusDetail(true);
                  }}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 border text-[10px] font-extrabold uppercase tracking-widest mt-auto transition cursor-pointer ${
                    isWorkingInSandbox 
                      ? "bg-amber-50 border-amber-200 text-amber-800" 
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  <div className={`h-2 w-2 rounded-full ${isWorkingInSandbox ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
                  <span>{isWorkingInSandbox ? "Offline Sandbox" : "Firebase Connected"}</span>
                </button>
              </div>

              {user && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50/50 py-3 text-xs font-extrabold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  Sign Out of Platform
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Connection Status Monitor Modal */}
      <AnimatePresence>
        {showStatusDetail && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 p-6 max-w-sm w-full shadow-2xl space-y-4 relative overflow-hidden text-left"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-orange-500 to-purple-600" />
              
              <div className="flex justify-between items-start pt-1">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Environment Sync Monitor</span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Database Connection
                  </h3>
                </div>
                <button
                  onClick={() => setShowStatusDetail(false)}
                  className="rounded-full bg-slate-100 p-1 text-slate-400 hover:text-slate-650 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5">
                {/* Visual state card */}
                <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                  isWorkingInSandbox 
                    ? "bg-amber-50/70 border-amber-100 text-amber-800" 
                    : "bg-emerald-50/70 border-emerald-100 text-emerald-800"
                }`}>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white shadow-xs shrink-0">
                    {isWorkingInSandbox ? (
                      <CloudOff className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Cloud className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wide">
                      {isWorkingInSandbox ? "Offline Sandbox Active" : "Google Cloud Synchronized"}
                    </h4>
                    <p className="text-[10px] opacity-80 leading-snug mt-0.5 font-medium">
                      {isWorkingInSandbox 
                        ? "Operations are writing to local browser sandbox storage." 
                        : "Direct live connection to enterprise-grade Firestore cluster."
                      }
                    </p>
                  </div>
                </div>

                {/* State Table */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-3 space-y-2 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Physical Connection:</span>
                    <span className={`font-extrabold px-2 py-0.5 rounded-md ${isOnline ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {isOnline ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Database Destination:</span>
                    <span className="font-extrabold text-slate-700">
                      {isWorkingInSandbox ? "localStorage IndexDB" : "Firestore Cluster"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Profile Authority:</span>
                    <span className="font-extrabold text-slate-700">
                      {isDemoSandbox ? "Classroom Sandbox Demo" : "Authenticated Cloud Account"}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                {isWorkingInSandbox 
                  ? "Your data is perfectly safe. Because our servers are built with resilient offline wrappers, any changes you make will be persistent locally in your browser workspace."
                  : "Every learning action, debate submission, voice sample, and assessment result is securely streamed and logged to Google Cloud services in real-time."
                }
              </p>

              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSimulatedOffline(!simulatedOffline);
                    setShowStatusDetail(false);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-center transition cursor-pointer ${
                    simulatedOffline 
                      ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-100" 
                      : "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-100"
                  }`}
                >
                  {simulatedOffline ? "🔌 Enable Cloud Sync Connection" : "📦 Simulate Offline Sandbox Mode"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatusDetail(false)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-center transition cursor-pointer"
                >
                  Close Monitor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
