import React from 'react';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Trash2, 
  User, 
  Settings as SettingsIcon,
  X,
  Command
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatDate } from '../../lib/utils';
import { Conversation, Settings } from '../../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  settings: Settings;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  setActiveConversationId,
  onNewConversation,
  onDeleteConversation,
  searchQuery,
  setSearchQuery,
  isOpen,
  setIsOpen,
  settings,
  onOpenSettings
}) => {
  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.aside 
      initial={false}
      animate={{ 
        width: isOpen ? 280 : 0,
        opacity: isOpen ? 1 : 0
      }}
      className="relative h-full bg-[#161618] border-r border-[#2D2D30] flex flex-col z-50 md:z-auto"
    >
      <div className="sidebar-header p-6 border-b border-[#2D2D30] overflow-hidden whitespace-nowrap">
        <button 
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 p-3 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white font-semibold rounded-lg transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 flex-shrink-0" />
          <span>New Thread</span>
        </button>
      </div>

      <div className="search-box mx-6 my-4 relative overflow-hidden whitespace-nowrap">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
        <input 
          type="text" 
          placeholder="Search history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#0A0A0B] border border-[#2D2D30] pl-10 pr-4 py-2.5 rounded-md text-[#EDEDED] text-sm focus:outline-none focus:ring-1 ring-[#3B82F6]/50 transition-all"
        />
      </div>

      <div className="history-list flex-1 overflow-y-auto px-3 space-y-1 no-scrollbar">
        {filteredConversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => setActiveConversationId(conv.id)}
            className={cn(
              "history-item w-full flex items-center gap-3 p-2.5 rounded-md transition-all group overflow-hidden whitespace-nowrap text-left text-sm",
              activeConversationId === conv.id 
                ? "bg-[#3B82F6]/10 text-[#3B82F6]" 
                : "text-[#EDEDED] hover:bg-white/5"
            )}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1 truncate">
              <div className="truncate">{conv.title}</div>
              <div className="text-[10px] opacity-40 font-mono mt-0.5">{formatDate(conv.updatedAt)}</div>
            </div>
            <Trash2 
              onClick={(e) => onDeleteConversation(conv.id, e)}
              className="w-4 h-4 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all flex-shrink-0" 
            />
          </button>
        ))}
      </div>

      <div className="sidebar-footer p-4 border-t border-[#2D2D30] bg-black/20 overflow-hidden whitespace-nowrap">
        <div className="user-profile flex items-center gap-3 text-sm">
          <div className="avatar w-8 h-8 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] rounded-full flex-shrink-0 shadow-lg shadow-[#3B82F6]/20" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[#EDEDED] truncate">{settings.username || 'Developer'}</div>
            <div className="text-[11px] text-[#A1A1AA] truncate">Local Host Access</div>
          </div>
          <button 
            onClick={onOpenSettings}
            className="p-2 hover:bg-white/5 rounded-md transition-colors"
          >
            <SettingsIcon className="w-4 h-4 text-[#A1A1AA]" />
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 hover:bg-white/10 rounded-md"
          >
            <X className="w-4 h-4 text-[#A1A1AA]" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
};
