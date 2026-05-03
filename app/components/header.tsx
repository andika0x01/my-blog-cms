"use client";

import { Link, useLocation, Form } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { House, PenNib, User, GearSix, SignOut, Plus, SignIn, Bell } from "@phosphor-icons/react";
import { cn } from "../utils/cn";
import { useState } from "react";

export function Header({ 
  isLoggedIn, 
  adminUnreadCount = 0, 
  visitorUnreadCount = 0,
  isVisitor = false
}: { 
  isLoggedIn: boolean; 
  adminUnreadCount?: number; 
  visitorUnreadCount?: number; 
  isVisitor?: boolean;
}) {
  const location = useLocation();
  const [showAdmin, setShowAdmin] = useState(false);

  const PUBLIC_NAV = [
    { path: "/", label: "Home", icon: House },
    { path: "/blog", label: "Blog", icon: PenNib },
    { path: "/tentang", label: "About", icon: User },
  ];

  const ADMIN_NAV = [
    { path: "/tulis", label: "Write", icon: Plus },
    { path: "/notifikasi", label: "Notifications", icon: Bell },
    { path: "/pengaturan", label: "Settings", icon: GearSix },
  ];

  return (
    <header className="py-6 flex items-center justify-between sticky top-0 z-50 bg-oled/80 backdrop-blur-md gap-1">
      <Link to="/" className="text-white font-medium tracking-tight text-sm md:text-xl shrink-0">
        <span className="hidden sm:inline">Andika Dinata</span>
        <span className="sm:hidden">AD</span>
        <span className="text-gray-500">.</span>
      </Link>

      <div className="flex items-center gap-1 md:gap-3">
        <nav className="flex items-center gap-0.5 md:gap-1 bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-xl">
          {PUBLIC_NAV.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(`${item.path}/`));
            const NavIcon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative px-2 md:px-4 py-2 text-xs md:text-sm transition-colors rounded-full flex items-center gap-2 z-10 font-medium",
                  isActive ? "text-oled" : "text-gray-400 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 bg-accent rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                )}
                <NavIcon weight={isActive ? "fill" : "regular"} className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden md:block">{item.label}</span>
              </Link>
            );
          })}

          {isLoggedIn && (
            <button
              type="button"
              onClick={() => setShowAdmin(!showAdmin)}
              className={cn("md:hidden p-2 rounded-full transition-colors relative", showAdmin ? "text-white bg-white/10" : "text-gray-500")}
            >
              <Plus className={cn("w-4 h-4 transition-transform", showAdmin && "rotate-45")} />
              {adminUnreadCount > 0 && !showAdmin && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          )}
        </nav>

        {!isLoggedIn && (
          <div className="flex items-center gap-1 md:gap-3">
            <Link to="/notifikasi" className="p-2 md:p-2.5 text-gray-400 hover:text-white bg-white/5 border border-white/10 rounded-full transition-colors relative" title="Notifikasi Anda">
              <Bell className="w-4 h-4" />
              {visitorUnreadCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {visitorUnreadCount > 9 ? "9+" : visitorUnreadCount}
                </span>
              )}
            </Link>
            <Link to="/login" className="p-2 md:p-2.5 text-gray-400 hover:text-white bg-white/5 border border-white/10 rounded-full transition-colors" title="Masuk">
              <SignIn weight="bold" className="w-4 h-4" />
            </Link>
          </div>
        )}

        {isLoggedIn && (
          <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
            {ADMIN_NAV.map((item) => {
              const AdminIcon = item.icon;
              const hasNotification = item.path === "/notifikasi" && adminUnreadCount > 0;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn("p-2 rounded-full transition-colors relative", location.pathname === item.path ? "text-white bg-white/10" : "text-gray-500 hover:text-white")}
                >
                  <AdminIcon className="w-5 h-5" />
                  {hasNotification && (
                    <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {adminUnreadCount > 9 ? "9+" : adminUnreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {isLoggedIn && (
          <Form method="post" action="/logout" className="shrink-0">
            <button type="submit" className="p-2 md:p-2.5 text-gray-400 hover:text-red-400 bg-white/5 border border-white/10 rounded-full transition-colors">
              <SignOut weight="bold" className="w-4 h-4" />
            </button>
          </Form>
        )}
      </div>

      <AnimatePresence>
        {isLoggedIn && showAdmin && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-20 right-5 left-5 z-[60] md:hidden">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-2 flex flex-col gap-1 shadow-2xl">
              {ADMIN_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowAdmin(false)}
                    className="flex items-center gap-3 p-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                  >
                    <Icon size={20} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
