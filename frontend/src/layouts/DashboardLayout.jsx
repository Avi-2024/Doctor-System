import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

function DashboardLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-medical-background md:flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="min-h-screen flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-[1600px]">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <AnimatePresence mode="wait">
            <motion.section
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.section>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
