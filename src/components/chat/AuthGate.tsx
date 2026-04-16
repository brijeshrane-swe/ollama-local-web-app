import React from 'react';
import { Shield } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthGateProps {
  password: string;
  setPassword: (val: string) => void;
  onUnlock: (e: React.FormEvent) => void;
  error: string;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  password,
  setPassword,
  onUnlock,
  error
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 bg-[#161618] border border-[#2D2D30] rounded-[2rem] space-y-8 shadow-2xl shadow-black"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-[#3B82F6]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#3B82F6]/20">
            <Shield className="w-8 h-8 text-[#3B82F6]" />
          </div>
          <h1 className="text-2xl font-bold text-[#EDEDED]">Secure Access</h1>
          <p className="text-[#A1A1AA] text-sm leading-relaxed">Your local history is encrypted. Enter your passcode to continue.</p>
        </div>
        <form onSubmit={onUnlock} className="space-y-6">
          <input 
            type="password" 
            placeholder="Passcode"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0A0A0B] border border-[#2D2D30] rounded-xl p-4 text-[#EDEDED] focus:ring-1 ring-[#3B82F6]/50 transition-all outline-none text-center text-lg tracking-[0.5em]"
          />
          {error && <p className="text-red-500 text-xs text-center font-bold tracking-wide uppercase">{error}</p>}
          <button className="w-full bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-[#3B82F6]/20 transition-all active:scale-95 uppercase tracking-widest text-xs">
            Unlock Vault
          </button>
        </form>
      </motion.div>
    </div>
  );
};
