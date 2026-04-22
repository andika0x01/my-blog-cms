"use client";

import { Link, useLocation, Form } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { House, PenNib, User, GearSix, SignOut, Plus, SignIn } from "@phosphor-icons/react";
import { cn } from "../utils/cn";
import { useState } from "react";

export function Header({ isLoggedIn }: { isLoggedIn: boolean }) {
  const location = useLocation();
  const [showAdmin, setShowAdmin] = useState(false);

  const PUBLIC_NAV = [
    { path: "/", label: "Home", icon: House },
    { path: "/blog", label: "Blog", icon: PenNib },
    { path: "/tentang", label: "About", icon: User },
  ];

  const ADMIN_NAV = [
    { path: "/tulis", label: "Tulis", icon: Plus },
    { path: "/pengaturan", label: "Settings", icon: GearSix },
  ];

  return (
    <header className="py-6 flex items-center justify-between sticky top-0 z-50 bg-oled/80 backdrop-blur-md">
      <Link to="/" className="text-white font-medium tracking-tight text-lg md:text-xl shrink-0">
        Andika Dinata<span className="text-gray-500">.</span>
      </Link>

      <div className="flex items-center gap-1.5 md:gap-3">
        <nav className="flex items-center gap-0.5 md:gap-1 bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-xl">
          {PUBLIC_NAV.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(`${item.path}/`));
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative px-3 md:px-4 py-2 text-sm transition-colors rounded-full flex items-center gap-2 z-10 font-medium",
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
                <Icon weight={isActive ? "fill" : "regular"} className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden md:block">{item.label}</span>
              </Link>
            );
          })}
          {isLoggedIn && (
            <button onClick={() => setShowAdmin(!showAdmin)} className={cn("md:hidden p-2 rounded-full transition-colors", showAdmin ? "text-white bg-white/10" : "text-gray-500")}>
              <Plus className={cn("w-5 h-5 transition-transform", showAdmin && "rotate-45")} />
            </button>
          )}
        </nav>
        {!isLoggedIn && (
          <Link to="/login" className="p-2.5 text-gray-400 hover:text-white bg-white/5 border border-white/10 rounded-full transition-colors" title="Masuk">
            <SignIn weight="bold" className="w-4 h-4" />
          </Link>
        )}
        {isLoggedIn && (
          <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn("p-2 rounded-full transition-colors", location.pathname === item.path ? "text-white bg-white/10" : "text-gray-500 hover:text-white")}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            ))}
          </div>
        )}
        {isLoggedIn && (
          <Form method="post" action="/logout" className="shrink-0">
            <button type="submit" className="p-2.5 text-gray-400 hover:text-red-400 bg-white/5 border border-white/10 rounded-full transition-colors">
              <SignOut weight="bold" className="w-4 h-4" />
            </button>
          </Form>
        )}
      </div>

      <AnimatePresence>
        {isLoggedIn && showAdmin && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-20 right-0 left-0 p-2 md:hidden">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-2 flex flex-col gap-1 shadow-2xl">
              {ADMIN_NAV.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowAdmin(false)}
                  className="flex items-center gap-3 p-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
