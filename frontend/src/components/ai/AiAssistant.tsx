import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Bot, MessageSquare, Sparkles, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestionCard {
  icon: typeof Sparkles;
  title: string;
  description: string;
}

const SUGGESTIONS: SuggestionCard[] = [
  { icon: Sparkles, title: 'Summarize patient history', description: 'Get a quick overview of selected patient.' },
  { icon: Zap,      title: 'Suggest follow-up plan',   description: 'Based on diagnosis and last visit.' },
  { icon: Bot,      title: 'Draft prescription notes',  description: 'Auto-generate clinical notes.' },
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export function AiAssistant() {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 'm0',
      role: 'assistant',
      text: "Hello! I'm your AI clinical assistant. Ask me about patients, diagnoses, or workflows.",
    },
  ]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text: trimmed },
    ]);
    setInput('');

    // Mock assistant reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: 'This is a demo response. Connect a real AI service (OpenAI, Anthropic, Gemini) to enable live answers tailored to your clinical context.',
        },
      ]);
    }, 600);
  };

  const handleSuggestion = (s: SuggestionCard) => sendMessage(s.title);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AI Assistant"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 380, damping: 28 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full',
          'bg-gradient-to-br from-brand-600 to-cyan-500 shadow-elevated',
          'transition-shadow duration-300 hover:shadow-[0_20px_50px_rgba(37,99,235,0.40)]',
          open && 'pointer-events-none opacity-0'
        )}
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 opacity-40 blur-md transition group-hover:opacity-60" />
        <span className="absolute -inset-1 rounded-full border border-brand-400/30" />
        <Sparkles className="relative h-6 w-6 text-white" strokeWidth={2.2} />
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop (mobile only) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm sm:hidden"
            />

            {/* Chat panel */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="fixed bottom-6 right-6 z-50 flex h-[600px] max-h-[calc(100vh-3rem)] w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-3xl border border-border-soft bg-white/95 shadow-elevated backdrop-blur-2xl"
            >
              {/* Glow border */}
              <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-brand-500/20 via-transparent to-cyan-500/20" />

              {/* Header */}
              <div className="relative flex items-center gap-3 border-b border-border-soft bg-gradient-to-br from-brand-500/8 to-cyan-500/8 p-4">
                <div className="relative">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-cyan-500 shadow-glow">
                    <Sparkles className="h-5 w-5 text-white" strokeWidth={2.2} />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink-primary">AI Clinical Assistant</p>
                  <p className="text-[11px] text-ink-secondary">Online · Ready to help</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close assistant"
                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-secondary transition hover:bg-slate-100 hover:text-ink-primary"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24 }}
                    className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                        m.role === 'user'
                          ? 'bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-glow'
                          : 'border border-border-soft bg-white text-ink-primary'
                      )}
                    >
                      {m.text}
                    </div>
                  </motion.div>
                ))}

                {/* Suggestions (shown only when fresh) */}
                {messages.length === 1 && (
                  <div className="mt-4 space-y-2">
                    <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      Try asking
                    </p>
                    {SUGGESTIONS.map((s, idx) => (
                      <motion.button
                        key={s.title}
                        type="button"
                        onClick={() => handleSuggestion(s)}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        whileHover={{ x: 2 }}
                        className="group flex w-full items-start gap-3 rounded-xl border border-border-soft bg-white p-3 text-left transition-all duration-200 hover:border-brand-500/30 hover:shadow-soft"
                      >
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-50 to-cyan-50 text-brand-600">
                          <s.icon size={14} strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-ink-primary">{s.title}</p>
                          <p className="mt-0.5 text-[11px] text-ink-secondary">{s.description}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="border-t border-border-soft bg-white/80 p-3 backdrop-blur">
                <div className="flex items-center gap-2 rounded-xl border border-border-soft bg-white p-1.5 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
                  <MessageSquare size={15} className="ml-2 shrink-0 text-ink-muted" />
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything about your clinic..."
                    className="h-9 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-ink-muted focus:outline-none focus:ring-0"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    aria-label="Send message"
                    className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-glow transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowUp size={14} strokeWidth={2.4} />
                  </button>
                </div>
                <p className="mt-2 text-center text-[10px] text-ink-muted">
                  Demo mode · Connect AI service for live answers
                </p>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default AiAssistant;
