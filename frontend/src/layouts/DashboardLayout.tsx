import * as React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import AiAssistant from '@/components/ai/AiAssistant';

export function DashboardLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative flex h-screen overflow-hidden">
      {/* Ambient background layers */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-32 top-0 h-[480px] w-[480px] rounded-full bg-brand-500/[0.04] blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-[520px] w-[520px] rounded-full bg-cyan-500/[0.05] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full bg-brand-500/[0.03] blur-3xl" />
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col px-4 sm:px-6 lg:px-8">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />

          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-10">
            <AnimatePresence mode="wait">
              <motion.section
                key={location.pathname}
                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
                transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              >
                <Outlet />
              </motion.section>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <AiAssistant />
    </div>
  );
}

export default DashboardLayout;
