import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCheck,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  Smile,
  X,
} from 'lucide-react';
import { cn, initialsOf } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Thread {
  id: string;
  name: string;
  role: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: string;
  from: 'me' | 'them';
  text: string;
  time: string;
  read: boolean;
}

const THREADS: Thread[] = [
  { id: '1', name: 'Dr. Ramesh Rao',   role: 'Doctor',       lastMsg: "Patient Aarav's reports are in.",   time: '10:24 AM', unread: 2,  online: true  },
  { id: '2', name: 'Anjali Desai',     role: 'Receptionist', lastMsg: 'Appointment rescheduled to 4 PM.',   time: '09:50 AM', unread: 0,  online: true  },
  { id: '3', name: 'Dr. Priya Shah',   role: 'Doctor',       lastMsg: 'Lab reports attached.',              time: 'Yesterday', unread: 1, online: false },
  { id: '4', name: 'Suresh Kumar',     role: 'Receptionist', lastMsg: 'Patient checkout done.',             time: 'Yesterday', unread: 0, online: false },
  { id: '5', name: 'Admin Support',    role: 'System',       lastMsg: 'Your subscription renews June 1.',  time: 'Mon',       unread: 0, online: false },
];

const CONVO: Record<string, Message[]> = {
  '1': [
    { id: 'm1', from: 'them', text: "Good morning! Just wanted to confirm that Aarav Sharma's blood reports arrived.", time: '10:15 AM', read: true },
    { id: 'm2', from: 'me',   text: "Thanks for the heads up. I'll review them before the consultation.", time: '10:17 AM', read: true },
    { id: 'm3', from: 'them', text: "Patient Aarav's reports are in. CBC and LFT look normal.", time: '10:24 AM', read: false },
  ],
  '2': [
    { id: 'm1', from: 'them', text: 'The 2:30 PM appointment for Rohan Iyer has been rescheduled to 4 PM.', time: '09:50 AM', read: true },
    { id: 'm2', from: 'me',   text: 'Got it, thanks for updating.', time: '09:52 AM', read: true },
  ],
  '3': [
    { id: 'm1', from: 'them', text: "Sneha Patel's allergy test results have arrived. Should I upload to her record?", time: 'Yesterday', read: false },
  ],
  '4': [],
  '5': [
    { id: 'm1', from: 'them', text: 'Your CityClinic Pro subscription auto-renews on June 1, 2026. No action needed.', time: 'Mon', read: true },
  ],
};

export default function MessagesPage() {
  const [active, setActive] = useState<string>('1');
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState<Record<string, Message[]>>(CONVO);

  const activeThread = THREADS.find(t => t.id === active)!;
  const convo = messages[active] ?? [];

  const filteredThreads = THREADS.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.lastMsg.toLowerCase().includes(search.toLowerCase())
  );

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => ({
      ...prev,
      [active]: [
        ...(prev[active] ?? []),
        { id: `m${Date.now()}`, from: 'me', text: input.trim(), time: 'Now', read: false },
      ],
    }));
    setInput('');
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-3xl border border-border-soft shadow-elevated">
      {/* Sidebar */}
      <div className="flex w-72 shrink-0 flex-col border-r border-border-soft bg-white">
        {/* Header */}
        <div className="p-4 pb-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600">Inbox</p>
          <h2 className="text-lg font-bold text-ink-primary">Messages</h2>
        </div>

        {/* Search */}
        <div className="mx-3 mb-3 flex items-center gap-2 rounded-xl border border-border-soft bg-bg-subtle px-3 py-2.5">
          <Search size={13} className="shrink-0 text-ink-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full bg-transparent text-xs font-medium text-ink-primary outline-none placeholder:text-ink-muted" />
          {search && <button onClick={() => setSearch('')}><X size={12} className="text-ink-muted" /></button>}
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.map((t) => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={cn(
                'group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                active === t.id ? 'bg-brand-50/60' : 'hover:bg-bg-subtle'
              )}>
              <div className="relative shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs">{initialsOf(t.name)}</AvatarFallback>
                </Avatar>
                {t.online && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-ink-primary truncate">{t.name}</p>
                  <p className="shrink-0 text-[10px] text-ink-muted">{t.time}</p>
                </div>
                <p className="truncate text-[11px] text-ink-secondary">{t.role}</p>
                <p className="mt-0.5 truncate text-xs text-ink-muted">{t.lastMsg}</p>
              </div>
              {t.unread > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                  {t.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col bg-bg-subtle/30">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-border-soft bg-white px-5 py-3.5">
          <div className="relative">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs">{initialsOf(activeThread.name)}</AvatarFallback>
            </Avatar>
            {activeThread.online && (
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white bg-emerald-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-ink-primary">{activeThread.name}</p>
            <p className="text-[11px] text-ink-secondary">{activeThread.role} · {activeThread.online ? 'Online' : 'Offline'}</p>
          </div>
          <Badge variant={activeThread.online ? 'success' : 'neutral'} className="ml-auto text-[10px]">
            {activeThread.online ? 'Active now' : 'Offline'}
          </Badge>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {convo.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <MessageSquare size={32} className="text-ink-muted" />
              <p className="font-semibold text-ink-secondary">No messages yet</p>
              <p className="text-sm text-ink-muted">Send a message to start the conversation</p>
            </div>
          )}
          <AnimatePresence>
            {convo.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn('flex gap-2.5', msg.from === 'me' && 'flex-row-reverse')}
              >
                {msg.from === 'them' && (
                  <Avatar className="h-7 w-7 shrink-0 mt-1">
                    <AvatarFallback className="text-[10px]">{initialsOf(activeThread.name)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                  'max-w-[65%] rounded-2xl px-4 py-2.5',
                  msg.from === 'me'
                    ? 'rounded-tr-sm bg-brand-600 text-white'
                    : 'rounded-tl-sm bg-white text-ink-primary shadow-soft'
                )}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <div className={cn('mt-0.5 flex items-center gap-1 text-[10px]', msg.from === 'me' ? 'text-brand-200 justify-end' : 'text-ink-muted')}>
                    <span>{msg.time}</span>
                    {msg.from === 'me' && <CheckCheck size={11} />}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Composer */}
        <div className="border-t border-border-soft bg-white px-4 py-3">
          <div className="flex items-end gap-3 rounded-2xl border border-border-soft bg-bg-subtle px-4 py-2.5 transition-all focus-within:border-brand-500/40 focus-within:bg-white focus-within:shadow-soft">
            <button className="text-ink-muted hover:text-ink-secondary transition-colors pb-0.5">
              <Paperclip size={17} />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-ink-primary outline-none placeholder:text-ink-muted"
            />
            <button className="text-ink-muted hover:text-ink-secondary transition-colors pb-0.5">
              <Smile size={17} />
            </button>
            <Button size="sm" onClick={sendMessage} className="h-8 w-8 p-0 shrink-0" disabled={!input.trim()}>
              <Send size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
