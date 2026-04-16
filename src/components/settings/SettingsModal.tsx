import React from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Settings } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  onToggleAuth: () => void;
  onClearHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  setSettings,
  onToggleAuth,
  onClearHistory
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0A0A0B]/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg bg-[#161618] rounded-2xl shadow-2xl border border-[#2D2D30] overflow-hidden"
          >
            <div className="p-6 border-b border-[#2D2D30] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-[#3B82F6]" />
                <h2 className="text-xl font-bold text-[#EDEDED]">Preferences</h2>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full text-[#A1A1AA]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#A1A1AA]">User Profile</h3>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#EDEDED]">User Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
                    <input 
                      value={settings.username}
                      onChange={(e) => setSettings(s => ({ ...s, username: e.target.value }))}
                      className="w-full bg-[#0A0A0B] border border-[#2D2D30] rounded-lg pl-12 pr-4 py-3 text-[#EDEDED] outline-none transition-all focus:ring-1 ring-[#3B82F6]/50"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#A1A1AA]">Ollama Configuration</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#EDEDED]">Ollama IP / Host</label>
                    <input 
                      value={settings.ollamaHost}
                      onChange={(e) => setSettings(s => ({ ...s, ollamaHost: e.target.value }))}
                      placeholder="http://localhost:11434"
                      className="w-full bg-[#0A0A0B] border border-[#2D2D30] rounded-lg px-4 py-3 text-[#EDEDED] outline-none transition-all focus:ring-1 ring-[#3B82F6]/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#EDEDED]">Model Name</label>
                    <input 
                      value={settings.modelName}
                      onChange={(e) => setSettings(s => ({ ...s, modelName: e.target.value }))}
                      className="w-full bg-[#0A0A0B] border border-[#2D2D30] rounded-lg px-4 py-3 text-[#EDEDED] outline-none transition-all focus:ring-1 ring-[#3B82F6]/50"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#A1A1AA]">Privacy & Security</h3>
                <div className="flex items-center justify-between p-4 bg-[#0A0A0B] border border-[#2D2D30] rounded-xl">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-[#3B82F6]" />
                    <div>
                      <p className="text-sm font-semibold text-[#EDEDED]">Profile Lock</p>
                      <p className="text-[10px] text-[#A1A1AA]">Require password to access data</p>
                    </div>
                  </div>
                  <button 
                    onClick={onToggleAuth}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                      localStorage.getItem('gemma-auth') 
                        ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" 
                        : "bg-[#3B82F6] text-white hover:opacity-90 shadow-lg shadow-[#3B82F6]/20"
                    )}
                  >
                    {localStorage.getItem('gemma-auth') ? 'Disable' : 'Enable'}
                  </button>
                </div>
                <button 
                  onClick={onClearHistory}
                  className="w-full flex items-center justify-center gap-2 p-3 text-red-500 font-bold text-xs bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-all border border-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                  Wipe Data History
                </button>
              </section>
            </div>

            <div className="p-6 bg-black/20 border-t border-[#2D2D30] flex items-center justify-center text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest opacity-40">
              Gemma Hub v1.0.0
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
