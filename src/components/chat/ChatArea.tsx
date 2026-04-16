import React, { useRef, useEffect } from 'react';
import { 
  Send, 
  Share2, 
  Settings as SettingsIcon, 
  Search, 
  Download,
  Command,
  HelpCircle,
  Menu,
  Sun,
  Moon,
  Plus,
  Database
} from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn, formatDate } from '../../lib/utils';
import { Conversation, Message, Settings } from '../../types';

interface ChatAreaProps {
  activeConversation: Conversation | undefined;
  isStreaming: boolean;
  ollamaError: string | null;
  input: string;
  setInput: (val: string) => void;
  onSendMessage: (text?: string) => void;
  onExport: (format: 'txt' | 'pdf' | 'csv') => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  onOpenSettings: () => void;
}

const SUGGESTED_PROMPTS = [
  "Explain quantum computing in simple terms",
  "Write a React component for a multi-step form",
  "How do I optimize a website for mobile devices?",
  "Tell me a joke about space"
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  activeConversation,
  isStreaming,
  ollamaError,
  input,
  setInput,
  onSendMessage,
  onExport,
  isSidebarOpen,
  setIsSidebarOpen,
  settings,
  setSettings,
  onOpenSettings
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, isStreaming]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Gemma Hub AI Chat',
        text: 'Check out this awesome AI chat interface for Ollama!',
        url: window.location.href,
      });
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-[#0A0A0B] relative">
      <header className="px-8 py-4 border-b border-[#2D2D30] flex items-center justify-between bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4">
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-[#A1A1AA]" />
            </button>
          )}
          <div className="model-info flex flex-col">
            <div className="model-name font-bold text-lg text-[#EDEDED] flex items-center gap-2">
              <span className="w-2 h-2 bg-[#10B981] rounded-full shadow-[0_0_8px_#10B981] animate-pulse"></span>
              {settings.modelName}
            </div>
            <div className="host-ip font-mono text-[11px] text-[#A1A1AA] mt-0.5 opacity-60">
              OLLAMA_HOST: {settings.ollamaHost}
            </div>
          </div>
        </div>

        <div className="header-actions flex items-center gap-4">
          <button 
            onClick={handleShare}
            className="icon-btn bg-transparent border border-[#2D2D30] text-[#A1A1AA] px-3 py-2 rounded-md text-xs cursor-pointer flex items-center gap-2 hover:bg-white/5 hover:text-[#EDEDED] transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
          <button 
            onClick={onOpenSettings}
            className="icon-btn bg-transparent border border-[#2D2D30] text-[#A1A1AA] px-3 py-2 rounded-md text-xs cursor-pointer flex items-center gap-2 hover:bg-white/5 hover:text-[#EDEDED] transition-all"
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </header>

      <div className="chat-container flex-1 overflow-y-auto px-8 py-8 space-y-8 no-scrollbar custom-scrollbar">
        {!activeConversation ? (
          <div className="h-full flex flex-col items-center justify-center space-y-12 max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="w-24 h-24 bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-[#3B82F6]/10 mb-8 border border-white/10">
                <Command className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight text-[#EDEDED]">Gemma Assistant</h2>
              <p className="text-[#A1A1AA] text-lg px-8 leading-relaxed">
                Interact with your local Gemma instance through a refined, low-latency interface.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={prompt}
                  onClick={() => onSendMessage(prompt)}
                  className="p-4 text-left border border-[#2D2D30] rounded-xl bg-[#161618]/50 hover:bg-[#161618] hover:border-[#3B82F6]/30 transition-all group flex items-center gap-3 text-sm font-medium text-[#A1A1AA] hover:text-[#EDEDED]"
                >
                  <div className="p-2 bg-[#3B82F6]/10 rounded-lg group-hover:bg-[#3B82F6]/20 transition-colors">
                    <Plus className="w-4 h-4 text-[#3B82F6]" />
                  </div>
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8 pb-32">
            {activeConversation.messages.map((m) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={m.id}
                className={cn(
                  "message flex gap-4 max-w-[90%]",
                  m.role === 'user' ? "flex-row-reverse self-end ml-auto" : "items-start"
                )}
              >
                <div className={cn(
                  "msg-bubble p-4 px-5 rounded-2xl shadow-sm leading-relaxed text-[15px]",
                  m.role === 'user' 
                    ? "bg-[#3B82F6] text-white rounded-tr-none" 
                    : "bg-[#161618] border border-[#2D2D30] text-[#EDEDED] rounded-tl-none"
                )}>
                  {m.thinking && (
                    <div className="mb-4 pb-4 border-b border-[#2D2D30]">
                      <div className="flex items-center gap-2 mb-2 text-[#3B82F6] text-[10px] font-bold uppercase tracking-widest">
                        <Database className="w-3 h-3" />
                        <span>AI Reasoning</span>
                      </div>
                      <div className="text-[#A1A1AA] text-xs font-mono italic leading-relaxed opacity-60">
                        {m.thinking}
                      </div>
                    </div>
                  )}
                  <div className="prose prose-sm max-w-none prose-p:my-1 prose-pre:my-2 prose-pre:bg-black/50 prose-pre:p-2 prose-pre:rounded-lg">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isStreaming && (
              <div className="message items-start gap-4">
                <div className="msg-bubble bg-[#161618] border border-[#2D2D30] p-4 px-5 rounded-2xl rounded-tl-none">
                  <span className="streaming text-[#3B82F6] font-bold">▋</span>
                </div>
              </div>
            )}

            {ollamaError && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto p-6 bg-red-500/5 border border-red-500/20 rounded-2xl relative overflow-hidden"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-red-500 font-bold text-lg">Connection Blocked</h3>
                    <p className="text-red-400/80 text-sm leading-relaxed">{ollamaError}</p>
                    
                    <div className="mt-4 pt-4 border-t border-red-500/10 space-y-3">
                      <p className="text-[#EDEDED] text-xs font-bold uppercase tracking-wider">Troubleshooting Steps:</p>
                      <ul className="text-[#A1A1AA] text-xs space-y-2 list-disc pl-4">
                        <li>
                          <strong>HTTPS Setup:</strong> Since this app is hosted on HTTPS, your Ollama endpoint <strong>must</strong> also be HTTPS. Use <code>ngrok http 11434</code> to get an HTTPS tunnel.
                        </li>
                        <li>
                          <strong>CORS Configuration:</strong> Run Ollama with <code>OLLAMA_ORIGINS="*"</code> set in your environment variables.
                        </li>
                        <li>
                          <strong>Network Access:</strong> Ensure Ollama is bound to <code>0.0.0.0</code> if you are using a local IP address other than 127.0.0.1.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="footer-input p-8 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B] to-transparent sticky bottom-0 z-30">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="input-wrapper bg-[#161618] border border-[#2D2D30] rounded-xl p-3 px-4 flex items-center gap-4 shadow-2xl">
            <textarea 
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
              placeholder="Message Gemma..."
              rows={1}
              className="flex-1 bg-transparent border-none text-[#EDEDED] resize-none focus:outline-none text-[15px] max-h-40"
            />
            <button 
              onClick={() => onSendMessage()}
              disabled={isStreaming || !input.trim()}
              className={cn(
                "send-btn w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-90",
                input.trim() 
                  ? "bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20" 
                  : "bg-[#2D2D30] text-[#A1A1AA] cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="export-options flex items-center justify-center gap-6 text-[11px] text-[#A1A1AA] font-bold uppercase tracking-widest opacity-60">
            <span>Export:</span>
            <button onClick={() => onExport('txt')} className="hover:text-[#EDEDED] transition-colors">.txt</button>
            <button onClick={() => onExport('pdf')} className="hover:text-[#EDEDED] transition-colors">.pdf</button>
            <button onClick={() => onExport('csv')} className="hover:text-[#EDEDED] transition-colors">.csv</button>
            <div className="w-[1px] h-3 bg-[#2D2D30] mx-2" />
            <span className="text-[#3B82F6]">History Synced to LocalStorage</span>
          </div>
        </div>
      </div>
    </main>
  );
};
