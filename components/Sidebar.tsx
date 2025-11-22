import React from 'react';
import { ViewMode, ConversationSession } from '../types';
import { PlusIcon, HistoryIcon, LibraryIcon, UserIcon, SparkleIcon, TrashIcon } from './Icons';

interface SidebarProps {
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
  sessions: ConversationSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  isMobile: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onToggle,
  isMobile
}) => {
  // Determine classes based on state
  const baseClasses = "fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out shadow-xl dark:shadow-none";
  const transformClasses = isOpen ? "translate-x-0" : "-translate-x-full";
  
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity"
          onClick={onToggle}
        />
      )}

      <div className={`${baseClasses} ${transformClasses}`}>
        {/* App Logo / Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 h-16">
           <div className="flex items-center space-x-2 text-gray-900 dark:text-white font-bold">
              <SparkleIcon className="w-6 h-6 text-blue-500" />
              <span className="text-lg tracking-tight">Gift Ai</span>
           </div>
           {/* Close button for mobile/desktop toggling */}
           <button onClick={onToggle} className="p-2 text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        {/* Main Nav */}
        <div className="flex flex-col p-3 space-y-2">
          <button 
            onClick={() => { onNewChat(); if(isMobile) onToggle(); }}
            className="flex items-center space-x-3 w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20 active:scale-95 transform duration-100"
          >
             <PlusIcon className="w-5 h-5" />
             <span className="font-medium">New Chat</span>
          </button>

          <div className="space-y-1 pt-2">
            <NavButton 
              active={currentView === ViewMode.CHAT && !!currentSessionId} 
              icon={<HistoryIcon className="w-5 h-5" />} 
              label="Conversations" 
              onClick={() => { onChangeView(ViewMode.CHAT); if(isMobile) onToggle(); }} 
            />
            <NavButton 
              active={currentView === ViewMode.LIBRARY} 
              icon={<LibraryIcon className="w-5 h-5" />} 
              label="Media Library" 
              onClick={() => { onChangeView(ViewMode.LIBRARY); if(isMobile) onToggle(); }} 
            />
            <NavButton 
              active={currentView === ViewMode.PROFILE} 
              icon={<UserIcon className="w-5 h-5" />} 
              label="Profile Settings" 
              onClick={() => { onChangeView(ViewMode.PROFILE); if(isMobile) onToggle(); }} 
            />
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            <div className="px-2 pt-2 pb-2 text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-wider flex items-center">
              <span>Recent History</span>
              <span className="ml-auto bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400 py-0.5 px-1.5 rounded text-[10px]">{sessions.length}</span>
            </div>
            
            {sessions.length === 0 && (
              <div className="px-4 py-4 text-sm text-gray-500 dark:text-slate-600 italic text-center border border-dashed border-gray-300 dark:border-slate-800 rounded-lg mx-2">
                No history yet.
              </div>
            )}

            <div className="space-y-1 pb-4">
              {sessions.map(s => (
                  <div key={s.id} className={`group relative flex items-center w-full rounded-lg transition-colors ${currentSessionId === s.id && currentView === ViewMode.CHAT ? 'bg-gray-200 dark:bg-slate-800' : 'hover:bg-gray-100 dark:hover:bg-slate-800/50'}`}>
                      <button 
                          onClick={() => { onSelectSession(s.id); if(isMobile) onToggle(); }}
                          className="flex-1 text-left px-3 py-2.5 truncate text-sm text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white"
                      >
                          {s.title || "Untitled Conversation"}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }}
                        className="md:hidden md:group-hover:flex p-2 text-gray-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title="Delete chat"
                      >
                          <TrashIcon className="w-4 h-4" />
                      </button>
                  </div>
              ))}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
             <div className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white dark:ring-slate-800">
               GO
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-medium text-gray-900 dark:text-white truncate">User Account</p>
               <p className="text-xs text-gray-500 dark:text-slate-500 truncate">Gemini Pro Plan</p>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

const NavButton = ({ active, icon, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-gray-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-medium shadow-sm' 
        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-white'
    }`}
  >
      {icon}
      <span>{label}</span>
  </button>
);