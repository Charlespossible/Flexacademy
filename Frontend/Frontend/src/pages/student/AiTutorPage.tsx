import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Send, RefreshCw, BookOpen, Zap,
  User, Sparkles, ChevronDown, MessageSquare, Plus,
  Trash2, PanelLeft, PanelLeftClose, X, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { MarkdownMessage } from '@/components/shared/MarkdownMessage';
import { aiTutorService, type AiSessionSummary } from '@/features/aiTutor/aiTutorService';
import { cn, formatRelative } from '@/lib/utils';
import type { SSEMessage } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  'Explain photosynthesis in simple terms',
  'What are the causes of World War 1?',
  'Help me understand quadratic equations',
  'Summarize Newton\'s laws of motion',
];

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Economics', 'Government', 'Literature'];

/** Remembers the desktop sidebar collapse preference across visits. */
const SIDEBAR_KEY = 'flexbot:sidebar-collapsed';
const SIDEBAR_WIDTH = 288; // px — matches the w-72 drawer on mobile

// localStorage can throw (Safari private mode, blocked storage). A preference
// is never worth crashing the page over, so both accessors fail soft.
function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === '1';
  } catch {
    return false;
  }
}
function writeCollapsed(value: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_KEY, value ? '1' : '0');
  } catch {
    /* preference simply won't persist */
  }
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
        isUser ? 'bg-accent/10 border border-accent/30' : 'bg-violet-400/10 border border-violet-400/30'
      )}>
        {isUser
          ? <User size={14} className="text-accent" />
          : <Brain size={14} className="text-violet-400" />}
      </div>

      {/* Bubble — assistant replies are Markdown, so they get more width */}
      <div className={cn(
        'min-w-0 rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'max-w-[75%] bg-accent text-base-elevated rounded-tr-sm'
          : 'max-w-[88%] bg-base-elevated border border-white/[0.06] text-text-primary rounded-tl-sm'
      )}>
        {isUser
          // User text is rendered verbatim; `whitespace-pre-wrap` keeps their
          // line breaks without interpreting anything they typed as Markdown.
          ? <span className="whitespace-pre-wrap break-words">{message.content}</span>
          : <MarkdownMessage content={message.content} />}
        <p className={cn(
          'text-xs mt-2 opacity-60',
          isUser ? 'text-right' : 'text-left'
        )}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-violet-400/10 border border-violet-400/30 shrink-0">
        <Brain size={14} className="text-violet-400" />
      </div>
      <div className="bg-base-elevated border border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-text-muted"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Conversation sidebar ─────────────────────────────────────────────────────
function ConversationSidebar({
  sessions,
  isLoading,
  activeId,
  loadingId,
  onSelect,
  onNew,
  onDelete,
  onClose,
  onCollapse,
}: {
  sessions: AiSessionSummary[];
  isLoading: boolean;
  activeId?: string;
  loadingId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  /** Mobile drawer dismiss */
  onClose?: () => void;
  /** Desktop collapse */
  onCollapse?: () => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full bg-base-surface border-r border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-white/[0.06] shrink-0">
        <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Conversations
        </span>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close conversations"
            className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-base-subtle transition-colors"
          >
            <X size={15} />
          </button>
        )}
        {onCollapse && (
          <button
            onClick={onCollapse}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-text-muted hover:text-text-primary hover:bg-base-subtle transition-colors"
          >
            <PanelLeftClose size={15} />
          </button>
        )}
      </div>

      {/* New chat */}
      <div className="p-2 shrink-0">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium
                     bg-accent/10 text-accent border border-accent/25
                     hover:bg-accent/15 transition-colors"
        >
          <Plus size={14} />
          New chat
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-base-elevated animate-pulse" />
          ))
        ) : sessions.length === 0 ? (
          <div className="text-center px-3 py-10">
            <MessageSquare size={20} className="text-text-muted mx-auto mb-2 opacity-50" />
            <p className="text-xs text-text-muted leading-relaxed">
              No conversations yet.<br />Ask FlexBot something to get started.
            </p>
          </div>
        ) : (
          sessions.map((s) => {
            const isActive = s.id === activeId;
            const isBusy = s.id === loadingId;
            return (
              <div
                key={s.id}
                className={cn(
                  'group relative rounded-xl border transition-colors',
                  isActive
                    ? 'bg-accent/10 border-accent/25'
                    : 'bg-transparent border-transparent hover:bg-base-elevated'
                )}
              >
                <button
                  onClick={() => onSelect(s.id)}
                  disabled={isBusy}
                  className="w-full text-left px-3 py-2.5 pr-8 min-w-0"
                >
                  <p className={cn(
                    'text-xs font-medium truncate',
                    isActive ? 'text-accent' : 'text-text-primary'
                  )}>
                    {s.preview || 'Untitled conversation'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-2xs text-text-muted">
                    {isBusy ? (
                      <><Loader2 size={9} className="animate-spin" /> Loading…</>
                    ) : (
                      <>
                        {s.subject && (
                          <>
                            <span className="text-accent/70 truncate max-w-[70px]">{s.subject}</span>
                            <span className="opacity-40">·</span>
                          </>
                        )}
                        <span className="shrink-0">{s.messageCount} msg{s.messageCount === 1 ? '' : 's'}</span>
                        <span className="opacity-40">·</span>
                        <span className="truncate">{formatRelative(s.updatedAt)}</span>
                      </>
                    )}
                  </div>
                </button>

                {/* Delete — two-step confirm so a stray click can't wipe a chat */}
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                  {confirmId === s.id ? (
                    <div className="flex items-center gap-1 bg-base-surface rounded-lg p-0.5">
                      <button
                        onClick={() => { onDelete(s.id); setConfirmId(null); }}
                        className="px-1.5 py-0.5 rounded text-2xs font-semibold text-brand-danger hover:bg-brand-danger/10"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="px-1.5 py-0.5 rounded text-2xs text-text-muted hover:text-text-primary"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(s.id)}
                      aria-label="Delete conversation"
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-text-muted
                                 opacity-0 group-hover:opacity-100 focus:opacity-100
                                 hover:text-brand-danger hover:bg-brand-danger/10 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function AiTutorPage() {
  const user = useAuthStore(s => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [subject, setSubject] = useState<string>('');
  const [showSubjects, setShowSubjects] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Desktop collapse — remembered across visits.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readCollapsed);
  const [loadingSessionId, setLoadingSessionId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const qc = useQueryClient();

  // ── Conversation list ──────────────────────────────────────────────────
  const { data: sessionsPage, isLoading: sessionsLoading } = useQuery({
    queryKey: ['ai-sessions'],
    queryFn: () => aiTutorService.getSessions({ limit: 50 }),
    staleTime: 30_000,
  });
  const sessions = sessionsPage?.data ?? [];

  /** Open a past conversation — replaces the transcript and resumes it. */
  const openSession = useCallback(async (id: string) => {
    if (isStreaming) abortRef.current?.abort();
    setLoadingSessionId(id);
    try {
      const detail = await aiTutorService.getSession(id);
      setMessages(
        detail.messages.map((m, i) => ({
          id: `${id}-${i}`,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
        }))
      );
      // Passing this back on the next send makes the server replay the
      // transcript into Claude's context, so the thread genuinely continues.
      setSessionId(id);
      setSubject(detail.subject ?? '');
      setSidebarOpen(false);
    } catch {
      toast.error('Could not open that conversation.');
    } finally {
      setLoadingSessionId(undefined);
    }
  }, [isStreaming]);

  const deleteSession = useCallback(async (id: string) => {
    try {
      await aiTutorService.deleteSession(id);
      if (id === sessionId) {
        setMessages([]);
        setSessionId(undefined);
      }
      qc.invalidateQueries({ queryKey: ['ai-sessions'] });
      toast.success('Conversation deleted');
    } catch {
      toast.error('Could not delete that conversation.');
    }
  }, [sessionId, qc]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
  }, [input]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    // Start assistant message with empty content
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }]);

    try {
      abortRef.current = new AbortController();
      const token = useAuthStore.getState().accessToken;
      const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';

      const response = await fetch(`${BASE_URL}/ai-tutor/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text.trim(),
          sessionId,
          subject: subject || undefined,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const evt = JSON.parse(jsonStr) as SSEMessage;

            if (evt.type === 'text') {
              accumulated += evt.content;
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: accumulated } : m
              ));
            } else if (evt.type === 'done') {
              if (evt.sessionId) setSessionId(evt.sessionId);
              // Surface the new/updated conversation in the sidebar and
              // refresh its preview, message count and timestamp.
              qc.invalidateQueries({ queryKey: ['ai-sessions'] });
            } else if (evt.type === 'error') {
              throw new Error(evt.message);
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      toast.error('FlexBot is unavailable. Please try again.');
      // Remove the empty assistant message
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [isStreaming, sessionId, subject]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    if (isStreaming) {
      abortRef.current?.abort();
    }
    setMessages([]);
    setSessionId(undefined);
    setIsStreaming(false);
  };

  const isEmpty = messages.length === 0;

  const toggleCollapsed = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      writeCollapsed(next);
      return next;
    });
  };

  const sidebarProps = {
    sessions,
    isLoading: sessionsLoading,
    activeId: sessionId,
    loadingId: loadingSessionId,
    onSelect: openSession,
    onNew: clearChat,
    onDelete: deleteSession,
  };

  return (
    <div className="min-h-dvh bg-base flex">

      {/* ── Sidebar: collapsible column on desktop ───────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 0 : SIDEBAR_WIDTH }}
        transition={{ type: 'tween', duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:block shrink-0 h-[calc(100dvh-4rem)] sticky top-16 overflow-hidden"
      >
        {/* Fixed inner width so the list doesn't reflow while animating */}
        <div style={{ width: SIDEBAR_WIDTH }} className="h-full">
          <ConversationSidebar {...sidebarProps} onCollapse={toggleCollapsed} />
        </div>
      </motion.aside>

      {/* ── Sidebar: slide-over drawer on mobile ─────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50"
            >
              <ConversationSidebar {...sidebarProps} onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Chat column ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
      {/* Header */}
      <div className="sticky top-16 z-20 bg-base/80 backdrop-blur border-b border-white/[0.06] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Drawer toggle — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open conversations"
              className="lg:hidden w-9 h-9 rounded-xl bg-base-elevated border border-white/[0.06] flex items-center justify-center text-text-muted hover:text-text-primary transition-colors shrink-0"
            >
              <PanelLeft size={15} />
            </button>

            {/* Expand toggle — desktop, only while collapsed */}
            {sidebarCollapsed && (
              <button
                onClick={toggleCollapsed}
                aria-label="Show conversations"
                title="Show conversations"
                className="hidden lg:flex w-9 h-9 rounded-xl bg-base-elevated border border-white/[0.06] items-center justify-center text-text-muted hover:text-text-primary transition-colors shrink-0"
              >
                <PanelLeft size={15} />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-violet-400/10 border border-violet-400/30 flex items-center justify-center shrink-0">
              <Brain size={17} className="text-violet-400" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-text-primary text-sm">FlexBot</h1>
              <p className="text-xs text-text-muted truncate">
                {sessionId ? 'Continuing a saved conversation' : 'AI Tutor.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Subject selector */}
            <div className="relative">
              <button
                onClick={() => setShowSubjects(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-base-elevated border border-white/[0.06] text-text-secondary hover:text-text-primary transition-colors"
              >
                <BookOpen size={12} />
                {subject || 'All subjects'}
                <ChevronDown size={11} />
              </button>
              <AnimatePresence>
                {showSubjects && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 2, scale: 0.97 }}
                    className="absolute top-full right-0 mt-1.5 w-44 bg-base-elevated border border-white/[0.08] rounded-xl shadow-card overflow-hidden z-50"
                  >
                    {['', ...SUBJECTS].map(s => (
                      <button
                        key={s || 'all'}
                        onClick={() => { setSubject(s); setShowSubjects(false); }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-xs transition-colors',
                          subject === s
                            ? 'text-accent bg-accent/10'
                            : 'text-text-secondary hover:text-text-primary hover:bg-base-subtle'
                        )}
                      >
                        {s || 'All subjects'}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-base-elevated border border-white/[0.06] text-text-secondary hover:text-text-primary transition-colors"
              >
                <RefreshCw size={12} /> New chat
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-5">
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-violet-400/10 border border-violet-400/30 flex items-center justify-center">
              <Sparkles size={32} className="text-violet-400" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-text-primary mb-2">
                Hello{user ? `, ${user.firstName}` : ''}! I'm FlexBot.
              </h2>
              <p className="text-text-muted text-sm max-w-sm">
                Your AI tutor. Ask me anything about your subjects — I can explain concepts, solve problems, and guide your exam prep.
              </p>
            </div>

            {/* Quick prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {QUICK_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left p-3 rounded-xl bg-base-surface border border-white/[0.06] text-xs text-text-secondary hover:text-text-primary hover:border-white/20 transition-all"
                >
                  <Zap size={11} className="text-accent inline mr-1.5" />
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <>
            {messages.map(msg => (
              msg.role === 'assistant' && msg.content === '' && isStreaming
                ? <TypingIndicator key={msg.id} />
                : <MessageBubble key={msg.id} message={msg} />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="sticky bottom-0 bg-base/80 backdrop-blur border-t border-white/[0.06] px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-base-surface border border-white/[0.08] rounded-2xl px-4 py-3 focus-within:border-accent/40 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask FlexBot anything… (Enter to send, Shift+Enter for new line)"
              rows={1}
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted resize-none outline-none leading-relaxed min-h-[22px] max-h-32"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-base-elevated hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {isStreaming
                ? <RefreshCw size={15} className="animate-spin" />
                : <Send size={15} />}
            </button>
          </div>
          <p className="text-xs text-text-muted text-center mt-2">
            FlexBot can make mistakes. Verify important information.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
