import React, { useState } from "react";
import { BookOpen, Award, Users, ShieldAlert, User, LogOut, Globe, FileText, Mic, Menu, X, Check } from "lucide-react";
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
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenAuth,
  logoUrl = ""
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileNavClick = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/95 backdrop-blur md:pb-0">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <button
          onClick={() => setActiveTab("landing")}
          className="flex items-center gap-2.5 transition hover:opacity-90"
        >
          {logoUrl ? (
            <div className="flex h-10 items-center justify-center rounded-xl overflow-hidden p-1 bg-white border border-slate-100 sleek-shadow">
              <img src={logoUrl} alt="Campaign Logo" className="h-8 max-w-[120px] object-contain" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <EFCLogo showOnlyWordmark={true} />
          )}
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => setActiveTab("landing")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              activeTab === "landing"
                ? "bg-blue-50/70 text-blue-600"
                : "text-slate-600 hover:bg-slate-50/70 hover:text-slate-900"
            }`}
          >
            Campaign Home
          </button>
          <button
            onClick={() => setActiveTab("learning")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              activeTab === "learning"
                ? "bg-blue-50/70 text-blue-600"
                : "text-slate-600 hover:bg-slate-50/70 hover:text-slate-900"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Learning Hub
          </button>
          <button
            onClick={() => setActiveTab("practice")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              activeTab === "practice"
                ? "bg-blue-50/70 text-blue-600"
                : "text-slate-600 hover:bg-slate-50/70 hover:text-slate-900"
            }`}
          >
            <Mic className="h-4 w-4" />
            Practice Arena
          </button>
          <button
            onClick={() => setActiveTab("community")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              activeTab === "community"
                ? "bg-blue-50/70 text-blue-600"
                : "text-slate-600 hover:bg-slate-50/70 hover:text-slate-900"
            }`}
          >
            <Users className="h-4 w-4" />
            Community & Debates
          </button>
          {user && (user.role === "admin" || user.role === "teacher") && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                activeTab === "admin"
                  ? "bg-amber-50 text-amber-700 border border-amber-200/50"
                  : "text-slate-600 hover:bg-slate-50/70 hover:text-slate-900"
              }`}
            >
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              Admin Panel
            </button>
          )}
        </nav>

        {/* Right Section: Auth & Actions */}
        <div className="hidden md:flex items-center gap-5">
          {/* Live Sync Status */}
          <div className="hidden lg:flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <div className="active-indicator"></div>
            Database Live Sync
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-3.5 text-xs font-semibold shadow-xs transition hover:bg-slate-50 ${
                  activeTab === "profile" ? "border-blue-500 bg-blue-50/30" : ""
                }`}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold uppercase text-[10px]">
                  {user.name.substring(0, 2)}
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[11px] text-slate-800 font-bold max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <span className="text-[9px] text-blue-600 font-semibold leading-none">
                    {user.level} • {user.xp} XP
                  </span>
                </div>
              </button>
              <button
                onClick={onLogout}
                title="Logout"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4.5 py-2 text-xs font-bold text-white shadow-md shadow-slate-100 transition hover:bg-slate-800 active:scale-95 cursor-pointer"
            >
              <User className="h-3.5 w-3.5" />
              Sign In / Register
            </button>
          )}
        </div>

        {/* Mobile Hamburger (Only visible if bottom nav isn't preferred or as supplementary) */}
        <div className="flex md:hidden items-center gap-3">
          {user ? (
            <button
              onClick={() => setActiveTab("profile")}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] border border-slate-200"
            >
              {user.name.substring(0, 2)}
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="rounded-xl bg-slate-900 p-2 text-white shadow-xs"
            >
              <User className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (4-5 Icons) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-150 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <div className="flex h-16 items-center justify-around px-2">
          <button
            onClick={() => handleMobileNavClick("landing")}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-800 transition ${
              activeTab === "landing" ? "text-blue-600 font-bold" : ""
            }`}
          >
            <Globe className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-bold leading-none">Home</span>
          </button>
          
          <button
            onClick={() => handleMobileNavClick("learning")}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-800 transition ${
              activeTab === "learning" ? "text-blue-600 font-bold" : ""
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-bold leading-none">Learn</span>
          </button>
          
          <button
            onClick={() => handleMobileNavClick("practice")}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-800 transition ${
              activeTab === "practice" ? "text-blue-600 font-bold" : ""
            }`}
          >
            <Mic className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-bold leading-none">Practice</span>
          </button>

          <button
            onClick={() => handleMobileNavClick("community")}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-800 transition ${
              activeTab === "community" ? "text-blue-600 font-bold" : ""
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-bold leading-none">Community</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-800 transition ${
              isMobileMenuOpen ? "text-blue-600 font-bold" : ""
            }`}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-bold leading-none">Menu</span>
          </button>
        </div>
      </div>

      {/* Togglable & Closable Sidebar Drawer on Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Dark blur backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-xs cursor-pointer"
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 max-w-xs w-full bg-white z-50 p-6 flex flex-col space-y-6 shadow-2xl border-l border-slate-100"
            >
              {/* Drawer header */}
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
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-3">
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

              {/* Navigation list */}
              <div className="flex-1 flex flex-col gap-1.5">
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

                {user && (user.role === "admin" || user.role === "teacher") && (
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

                {/* Database Sync Status Indicator */}
                <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest mt-auto">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Firebase Connected</span>
                </div>
              </div>

              {/* Drawer Logout button */}
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
    </header>
  );
};
export default Navbar;
