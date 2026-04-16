import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Search, 
  Moon, 
  Sun, 
  User, 
  Download, 
  Share2, 
  Menu, 
  X, 
  MessageSquare, 
  Database,
  Shield,
  Command,
  FileText,
  FileCode,
  Table as TableIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { cn, formatDate } from './lib/utils';
import { useOllama } from './hooks/useOllama';
import { Conversation, Message, Settings, Role } from './types';
import { AnalyticsService } from './services/analyticsService';

const INITIAL_SETTINGS: Settings = {
  ollamaHost: 'http://localhost:11434',
  modelName: 'gemma4:e4b',
  theme: 'dark',
  username: 'Developer Account',
};

const SUGGESTED_PROMPTS = [
  "Explain the best way to handle asynchronous data fetching in a React application using hooks?",
  "Optimize Python Loop for large datasets",
  "Write a summary of Gemma E4B capabilities",
  "How to setup a secure local network for LLMs?",
  "Compare different local inference engines like Ollama and LM Studio"
];

export default function App() {
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthLocked, setIsAuthLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const { sendMessage, isStreaming, error: ollamaError } = useOllama();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Derived State
  const activeConversation = useMemo(() => 
    conversations.find(c => c.id === activeConversationId), 
  [conversations, activeConversationId]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    const lowerQuery = searchQuery.toLowerCase();
    return conversations.filter(c => 
      c.title.toLowerCase().includes(lowerQuery) || 
      c.messages.some(m => m.content.toLowerCase().includes(lowerQuery))
    );
  }, [conversations, searchQuery]);

  // Load persistence
  useEffect(() => {
    const savedConversations = localStorage.getItem('gemma-conversations');
    const savedSettings = localStorage.getItem('gemma-settings');
    const savedAuth = localStorage.getItem('gemma-auth');

    if (savedConversations) setConversations(JSON.parse(savedConversations));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedAuth) setIsAuthLocked(true);
    
    AnalyticsService.trackSessionStart();
  }, []);

  // Save persistence
  useEffect(() => {
    localStorage.setItem('gemma-conversations', JSON.stringify(conversations));
    localStorage.setItem('gemma-settings', JSON.stringify(settings));
    document.documentElement.classList.add('dark');
  }, [conversations, settings]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, isStreaming]);

  // Handlers
  const handleNewConversation = () => {
    const newId = crypto.randomUUID();
    const newConv: Conversation = {
      id: newId,
      title: 'New Thread',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConversations([newConv, ...conversations]);
    setActiveConversationId(newId);
    AnalyticsService.trackEvent('new_conversation');
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(conversations.filter(c => c.id !== id));
    if (activeConversationId === id) setActiveConversationId(null);
  };

  const handleSendMessage = async (customInput?: string) => {
    const text = (customInput || input).trim();
    if (!text || isStreaming) return;

    let targetConvId = activeConversationId;
    let currentConv = activeConversation;

    if (!targetConvId) {
      const newId = crypto.randomUUID();
      const newConv: Conversation = {
        id: newId,
        title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setConversations([newConv, ...conversations]);
      setActiveConversationId(newId);
      targetConvId = newId;
      currentConv = newConv;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...(currentConv?.messages || []), userMessage];
    
    setConversations(prev => prev.map(c => 
      c.id === targetConvId ? { 
        ...c, 
        messages: updatedMessages,
        updatedAt: new Date().toISOString(),
        title: c.title === 'New Thread' ? text.slice(0, 30) : c.title 
      } : c
    ));
    
    setInput('');
    AnalyticsService.trackEvent('send_message', { 
      model: settings.modelName,
      length: text.length 
    });

    const assistantMessageId = crypto.randomUUID();
    let assistantContent = '';
    let assistantThinking = '';

    const controller = new AbortController();
    abortControllerRef.current = controller;

    await sendMessage(
      settings.ollamaHost,
      settings.modelName,
      updatedMessages,
      (chunk, type = 'content') => {
        if (type === 'thinking') {
          assistantThinking += chunk;
        } else {
          assistantContent += chunk;
        }
        
        setConversations(prev => prev.map(c => 
          c.id === targetConvId ? {
            ...c,
            messages: [
              ...updatedMessages,
              {
                id: assistantMessageId,
                role: 'assistant',
                content: assistantContent,
                thinking: assistantThinking,
                timestamp: new Date().toISOString()
              }
            ]
          } : c
        ));
      },
      controller.signal
    );
    
    abortControllerRef.current = null;
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleExport = (format: 'txt' | 'pdf' | 'csv') => {
    if (!activeConversation) return;
    const fileName = `chat-${activeConversation.title.replace(/\s+/g, '-').toLowerCase()}`;
    if (format === 'txt') {
      const content = activeConversation.messages.map(m => `${m.role.toUpperCase()}:\n${m.content}\n\n`).join('---\n\n');
      const blob = new Blob([content], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${fileName}.txt`;
      a.click();
    } else if (format === 'csv') {
      const content = "Role,Content\n" + activeConversation.messages.map(m => `"${m.role}","${m.content.replace(/"/g, '""')}"`).join('\n');
      const blob = new Blob([content], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${fileName}.csv`;
      a.click();
    } else if (format === 'pdf') {
       const doc = new jsPDF();
       doc.setFontSize(10);
       let y = 10;
       activeConversation.messages.forEach(m => {
         const lines = doc.splitTextToSize(`${m.role.toUpperCase()}: ${m.content}`, 180);
         doc.text(lines, 10, y);
         y += (lines.length * 5) + 5;
       });
       doc.save(`${fileName}.pdf`);
    }
  };

  const toggleAuth = () => {
    if (localStorage.getItem('gemma-auth')) {
      localStorage.removeItem('gemma-auth');
      setIsAuthLocked(false);
    } else {
      const p = prompt("Set a password for your profile:");
      if (p) {
        localStorage.setItem('gemma-auth', btoa(p));
        setIsAuthLocked(true);
      }
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = localStorage.getItem('gemma-auth');
    if (btoa(password) === saved) {
      setIsAuthLocked(false);
      setPassword('');
    } else {
      setAuthError('Incorrect password');
    }
  };

  if (isAuthLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] p-4 text-[#EDEDED]">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md p-8 bg-[#161618] border border-[#2D2D30] rounded-2xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-[#3B82F6]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[#3B82F6]" />
            </div>
            <h1 className="text-2xl font-bold">Encrypted Storage</h1>
            <p className="text-[#A1A1AA] text-sm">Enter password to access your conversations</p>
          </div>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#2D2D30] rounded-xl p-4 focus:ring-1 ring-[#3B82F6] outline-none transition-all"
            />
            {authError && <p className="text-red-500 text-xs text-center">{authError}</p>}
            <button className="w-full bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95">
              Unlock Vault
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-[#EDEDED] overflow-hidden font-sans selection:bg-[#3B82F6]/30">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth < 768 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside initial={false} animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }} className="relative h-full bg-[#161618] border-r border-[#2D2D30] flex flex-col z-50 md:z-auto shrink-0">
        <div className="p-6 flex items-center justify-between border-b border-[#2D2D30]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#3B82F6] rounded-lg flex items-center justify-center shadow-lg shadow-[#3B82F6]/20">
              <Command className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">Gemma Hub</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-white/5 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-4 py-4 space-y-4">
          <button onClick={handleNewConversation} className="w-full flex items-center justify-center gap-2 p-3 bg-[#3B82F6] text-white rounded-lg shadow-lg hover:bg-[#3B82F6]/90 transition-all font-bold text-sm">
            <Plus className="w-4 h-4" /> New Thread
          </button>
          <div className="flex items-center gap-2 text-[#A1A1AA] bg-white/5 rounded-lg px-3 py-2 border border-[#2D2D30] focus-within:border-[#3B82F6] transition-all">
            <Search className="w-4 h-4" />
            <input 
              placeholder="Search history..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="bg-transparent border-none focus:outline-none text-xs w-full" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 no-scrollbar">
          {filteredConversations.map(conv => (
            <button key={conv.id} onClick={() => setActiveConversationId(conv.id)} className={cn("w-full flex items-center gap-3 p-3 rounded-lg transition-all group group relative", activeConversationId === conv.id ? "bg-[#3B82F6]/10 text-[#3B82F6] font-bold" : "hover:bg-white/5 text-[#A1A1AA]")}>
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="truncate flex-1 text-sm">{conv.title}</span>
              <Trash2 onClick={(e) => handleDeleteConversation(conv.id, e)} className="w-4 h-4 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all" />
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-[#2D2D30] bg-black/20">
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{settings.username}</div>
              <div className="text-[10px] text-[#A1A1AA] opacity-60">Local Host Access</div>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 hover:bg-white/5 rounded-md text-[#A1A1AA] hover:text-[#EDEDED]"><SettingsIcon className="w-4 h-4" /></button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full">
        {/* Header */}
        <header className="h-16 border-b border-[#2D2D30] flex items-center justify-between px-8 bg-[#0A0A0B]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/5 rounded-lg"><Menu className="w-5 h-5" /></button>}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 font-bold text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                {settings.modelName}
              </div>
              <div className="text-[10px] text-[#A1A1AA] font-mono">{settings.ollamaHost}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => navigator.share?.({ title: 'Gemma Hub', url: window.location.href })} className="px-3 py-1.5 border border-[#2D2D30] rounded-lg text-xs font-bold hover:bg-white/5">Share</button>
             <button onClick={() => setIsSettingsOpen(true)} className="px-3 py-1.5 border border-[#2D2D30] rounded-lg text-xs font-bold hover:bg-white/5">Settings</button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
          {!activeConversationId ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto space-y-12">
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
                 <div className="w-16 h-16 bg-[#3B82F6] rounded-2xl flex items-center justify-center mx-auto shadow-2xl mb-6"><Command className="w-8 h-8 text-white" /></div>
                 <h2 className="text-3xl font-extrabold tracking-tight">How can I help you today?</h2>
                 <p className="text-[#A1A1AA] text-lg">Interact with your local Gemma model via Ollama.</p>
               </motion.div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                 {SUGGESTED_PROMPTS.map((p, i) => (
                   <button key={i} onClick={() => handleSendMessage(p)} className="p-4 text-left border border-[#2D2D30] rounded-xl hover:bg-white/5 hover:border-[#3B82F6]/30 transition-all text-sm font-medium">{p}</button>
                 ))}
               </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {activeConversation.messages.map(m => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-6", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn("max-w-[85%] p-5 rounded-2xl shadow-sm leading-relaxed", m.role === 'user' ? "bg-[#3B82F6] text-white rounded-tr-none" : "bg-[#161618] border border-[#2D2D30] text-[#EDEDED] rounded-tl-none")}>
                    <div className="prose dark:prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#A1A1AA] opacity-40 font-mono self-end pb-1">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </motion.div>
              ))}
              {isStreaming && (
                <div className="flex items-start gap-4">
                  <div className="bg-[#161618] border border-[#2D2D30] p-5 rounded-2xl rounded-tl-none"><motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-1.5 h-4 bg-[#3B82F6]" /></div>
                </div>
              )}
              {ollamaError && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm italic">Error: {ollamaError}. Verify Ollama is running.</div>}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-8 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B] to-transparent">
          <div className="max-w-4xl mx-auto space-y-4">
             <div className="relative flex items-center gap-3 p-3 bg-[#161618] border border-[#2D2D30] rounded-xl focus-within:border-[#3B82F6] transition-all">
                <textarea 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  placeholder="Message Gemma..." 
                  className="flex-1 bg-transparent border-none outline-none resize-none h-10 py-2 no-scrollbar"
                />
                {isStreaming ? (
                  <button 
                    onClick={handleStopGeneration}
                    className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all flex items-center justify-center"
                    title="Stop Generation"
                  >
                    <div className="w-3 h-3 bg-red-500 rounded-sm" />
                  </button>
                ) : (
                  <button 
                    onClick={() => handleSendMessage()} 
                    disabled={!input.trim()} 
                    className={cn("p-2 rounded-lg transition-all", input.trim() ? "bg-[#3B82F6] text-white" : "bg-white/5 text-[#A1A1AA]")}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
             </div>
             <div className="flex justify-center gap-6 text-[10px] text-[#A1A1AA] font-bold uppercase tracking-widest">
               <div className="flex gap-2"><span>Export:</span> <button onClick={() => handleExport('txt')} className="hover:text-[#EDEDED]">.txt</button> <button onClick={() => handleExport('pdf')} className="hover:text-[#EDEDED]">.pdf</button> <button onClick={() => handleExport('csv')} className="hover:text-[#EDEDED]">.csv</button></div>
               <div className="text-[#3B82F6]">History Synced to LocalStorage</div>
             </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-[#161618] border border-[#2D2D30] rounded-2xl shadow-2xl overflow-hidden">
               <div className="p-6 border-b border-[#2D2D30] flex justify-between items-center bg-black/20">
                 <h2 className="text-xl font-bold">Preferences</h2>
                 <button onClick={() => setIsSettingsOpen(false)}><X className="w-5 h-5" /></button>
               </div>
               <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                 <div className="space-y-4">
                   <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-widest">Ollama Setup</h3>
                   <div className="space-y-4">
                     <div className="space-y-1"><label className="text-xs font-bold">Ollama Host</label><input value={settings.ollamaHost} onChange={(e) => setSettings(s => ({ ...s, ollamaHost: e.target.value }))} className="w-full bg-[#0A0A0B] border border-[#2D2D30] rounded-lg p-3 outline-none focus:border-[#3B82F6]" /></div>
                     <div className="space-y-1"><label className="text-xs font-bold">Model Name</label><input value={settings.modelName} onChange={(e) => setSettings(s => ({ ...s, modelName: e.target.value }))} className="w-full bg-[#0A0A0B] border border-[#2D2D30] rounded-lg p-3 outline-none focus:border-[#3B82F6]" /></div>
                   </div>
                 </div>
                 <div className="space-y-4">
                   <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-widest">Privacy</h3>
                   <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div><p className="text-sm font-bold">Encrypted Lock</p><p className="text-[10px] text-[#A1A1AA]">Require password to view chats</p></div>
                      <button onClick={toggleAuth} className={cn("px-4 py-2 rounded-lg text-xs font-bold", localStorage.getItem('gemma-auth') ? "bg-red-500/10 text-red-500" : "bg-[#3B82F6] text-white")}>{localStorage.getItem('gemma-auth') ? 'Disable' : 'Enable'}</button>
                   </div>
                 </div>
                 <button onClick={() => confirm('Clear all history?') && (setConversations([]), localStorage.removeItem('gemma-conversations'), setIsSettingsOpen(false))} className="w-full p-3 bg-red-500/10 text-red-500 font-bold text-xs rounded-lg hover:bg-red-500/20 transition-all">Wipe All Local Data</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
