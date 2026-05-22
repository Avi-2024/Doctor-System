import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronsUpDown,
  Command as CommandIcon,
  CreditCard,
  LogOut,
  Menu,
  Pill,
  Search,
  Settings,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn, initialsOf } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@/components/ui/Command';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

interface TopbarProps {
  onMenuClick: () => void;
}

const CLINICS = [
  { id: 'c1', name: 'City Care Clinic', city: 'Mumbai' },
  { id: 'c2', name: 'Gastro Cure Center', city: 'Pune' },
];

export function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [activeClinic, setActiveClinic] = React.useState(CLINICS[0]);

  const displayName = user?.email?.split('@')[0]?.replace(/[._-]/g, ' ') ?? 'Doctor';
  const role = user?.role === 'CLINIC_OWNER' ? 'Clinic Owner' : user?.role === 'DOCTOR' ? 'General Physician' : 'Receptionist';

  // Cmd+K / Ctrl+K to open command palette
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const navigateTo = (path: string) => () => {
    setPaletteOpen(false);
    navigate(path);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <header className="sticky top-0 z-20 -mx-4 mb-6 px-4 pt-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <motion.div
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
          className="flex h-16 items-center gap-3 rounded-2xl border border-white/60 bg-white/75 px-4 shadow-soft backdrop-blur-xl"
        >
          {/* Mobile menu */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border-soft bg-white text-ink-secondary transition hover:text-ink-primary md:hidden"
          >
            <Menu size={18} />
          </button>

          {/* Search trigger — Raycast-style */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="group flex h-10 min-w-0 flex-1 items-center gap-3 rounded-xl border border-border-soft bg-slate-50/60 px-4 text-left text-sm text-ink-muted transition-all duration-200 ease-premium hover:border-brand-500/30 hover:bg-white hover:shadow-soft"
          >
            <Search size={16} className="shrink-0 transition group-hover:text-brand-600" />
            <span className="truncate">Search patients, appointments, prescriptions...</span>
            <kbd className="ml-auto hidden items-center gap-1 rounded-md border border-border-soft bg-white px-1.5 py-0.5 text-[10px] font-medium text-ink-secondary md:inline-flex">
              <CommandIcon size={10} />K
            </kbd>
          </button>

          {/* Clinic selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="hidden h-10 items-center gap-2 rounded-xl border border-border-soft bg-white px-3 text-sm font-medium text-ink-primary transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:shadow-soft lg:inline-flex"
              >
                <div className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-brand-500 to-cyan-500">
                  <Building2 size={12} className="text-white" />
                </div>
                <span className="max-w-[140px] truncate">{activeClinic.name}</span>
                <ChevronsUpDown size={14} className="text-ink-muted" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Switch Clinic</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {CLINICS.map((clinic) => (
                <DropdownMenuItem key={clinic.id} onClick={() => setActiveClinic(clinic)} className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500/10 to-cyan-500/10">
                    <Building2 size={14} className="text-brand-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{clinic.name}</p>
                    <p className="text-xs text-ink-muted">{clinic.city}</p>
                  </div>
                  {activeClinic.id === clinic.id && <Badge variant="brand" className="text-[10px]">Active</Badge>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date */}
          <div className="hidden h-10 items-center gap-2 rounded-xl border border-border-soft bg-white px-3 text-sm text-ink-secondary xl:inline-flex">
            <CalendarDays size={14} className="text-brand-600" />
            <span className="font-medium text-ink-primary">{today}</span>
          </div>

          {/* AI assistant */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="AI Assistant"
                className="grid h-10 w-10 place-items-center rounded-xl border border-border-soft bg-gradient-to-br from-brand-50 to-cyan-50 text-brand-600 transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:shadow-soft"
              >
                <Sparkles size={16} strokeWidth={2.2} />
              </button>
            </TooltipTrigger>
            <TooltipContent>AI Assistant</TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Notifications"
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-border-soft bg-white text-ink-secondary transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:text-ink-primary hover:shadow-soft"
              >
                <Bell size={16} strokeWidth={1.8} />
                <span className="absolute right-2 top-2 grid h-4 min-w-[16px] place-items-center rounded-full bg-gradient-to-br from-red-500 to-red-600 px-1 text-[9px] font-bold text-white shadow-sm">
                  5
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>5 new notifications</TooltipContent>
          </Tooltip>

          {/* Profile menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-10 items-center gap-2 rounded-xl border border-border-soft bg-white pl-1 pr-2.5 transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:shadow-soft"
              >
                <Avatar className="h-8 w-8 ring-2 ring-brand-500/20">
                  <AvatarFallback className="text-[11px]">{initialsOf(displayName)}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left lg:block">
                  <p className="text-xs font-semibold capitalize leading-tight text-ink-primary">{displayName}</p>
                  <p className="text-[10px] leading-tight text-ink-muted">{role}</p>
                </div>
                <ChevronDown size={14} className="hidden text-ink-muted lg:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold capitalize text-ink-primary">{displayName}</p>
                <p className="text-xs text-ink-muted">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={navigateTo('/settings')}>
                <Settings size={14} />
                Account Settings
                <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={navigateTo('/billing')}>
                <CreditCard size={14} />
                Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-danger focus:bg-red-50 focus:text-danger">
                <LogOut size={14} />
                Sign out
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </header>

      {/* Command palette */}
      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={navigateTo('/patients')}>
              <Users size={16} className="text-ink-secondary" />
              <span>Add new patient</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={navigateTo('/doctor/consultation')}>
              <Stethoscope size={16} className="text-ink-secondary" />
              <span>Start consultation</span>
              <CommandShortcut>⌘C</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={navigateTo('/prescriptions')}>
              <Pill size={16} className="text-ink-secondary" />
              <span>Write prescription</span>
            </CommandItem>
            <CommandItem onSelect={navigateTo('/appointments')}>
              <CalendarDays size={16} className="text-ink-secondary" />
              <span>Book appointment</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={navigateTo('/dashboard')}>
              <Sparkles size={16} className="text-ink-secondary" />
              <span>Go to Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={navigateTo('/billing')}>
              <CreditCard size={16} className="text-ink-secondary" />
              <span>Reports & Billing</span>
            </CommandItem>
            <CommandItem onSelect={navigateTo('/settings')}>
              <Settings size={16} className="text-ink-secondary" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </TooltipProvider>
  );
}

export default Topbar;
