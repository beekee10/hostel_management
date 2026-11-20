import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { motion } from "framer-motion";

export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfd] dark:bg-[#090a0d] text-zinc-900 dark:text-zinc-100 drizzle-grid-bg transition-colors duration-200">
      <Navbar
        onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)}
        isMobileNavOpen={mobileNavOpen}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <Sidebar />

        <MobileNav
          isOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-20 md:pb-8 w-full max-w-full overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
