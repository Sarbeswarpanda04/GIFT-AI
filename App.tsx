import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageRole, ChatMessage, Attachment, AppMode, GenerationConfigState, ViewMode, ConversationSession, SavedCreation, UserProfile } from './types';
import { ChatMessage as ChatMessageComponent } from './components/ChatMessage';
import { InputArea } from './components/InputArea';
import { blobToBase64 } from './utils/audioUtils';
import * as GeminiService from './services/geminiService';
import * as StorageService from './services/storageService';
import { BrainIcon, SparkleIcon, ShareIcon, SunIcon, MoonIcon } from './components/Icons';
import { Sidebar } from './components/Sidebar';
import { ProfileView, LibraryView, ShareModal } from './components/DashboardViews';

function App() {
  // --- State ---
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CHAT);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Session State
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Content State (Active Session)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Feature State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  // Configuration
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [config, setConfig] = useState<GenerationConfigState>({
    aspectRatio: "1:1",
    imageSize: "1K",
    searchEnabled: false,
    thinkingMode: false,
  });

  // Data Stores
  const [library, setLibrary] = useState<SavedCreation[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareItem, setShareItem] = useState<SavedCreation | null>(null);

  // Refs
  const liveDisconnectRef = useRef<(() => Promise<void>) | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextAudioTimeRef = useRef<number>(0);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // --- Initialization ---
  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth <= 768;
        setIsMobile(mobile);
        if (mobile && sidebarOpen) setSidebarOpen(false);
        if (!mobile && !sidebarOpen) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);

    // Load data
    const loadedProfile = StorageService.getProfile();
    const loadedSessions = StorageService.getSessions();
    const loadedLibrary = StorageService.getLibrary();
    const lastId = StorageService.getLastSessionId();

    setProfile(loadedProfile);
    setSessions(loadedSessions);
    setLibrary(loadedLibrary);

    // Theme logic
    if (loadedProfile?.preferences?.theme) {
        setTheme(loadedProfile.preferences.theme);
    }

    if (lastId && loadedSessions.find(s => s.id === lastId)) {
        // Manually load without calling loadSession to avoid state batching issues in effect
        setCurrentSessionId(lastId);
        setMessages(loadedSessions.find(s => s.id === lastId)!.messages);
        setViewMode(ViewMode.CHAT);
    } else {
        // Create new session logic inline
        const newId = Date.now().toString();
        const newSession: ConversationSession = {
            id: newId,
            title: 'New Chat',
            messages: [],
            lastModified: Date.now(),
            preview: ''
        };
        setSessions([newSession, ...loadedSessions]);
        setCurrentSessionId(newId);
        setMessages([]);
        StorageService.saveSession(newSession);
        StorageService.setLastSessionId(newId);
        setViewMode(ViewMode.CHAT);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (viewMode === ViewMode.CHAT) {
        setTimeout(() => {
            scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
  }, [messages.length, viewMode, isProcessing]);

  // Save session on update
  useEffect(() => {
      if (currentSessionId && messages.length > 0) {
          const session = sessions.find(s => s.id === currentSessionId);
          // Only update if messages actually changed to avoid loops (React compares refs)
          if (session && session.messages !== messages) {
              const updatedSession: ConversationSession = {
                  ...session,
                  messages,
                  lastModified: Date.now(),
                  title: session.title === 'New Chat' && messages.length > 0 
                    ? (messages[0].text?.slice(0, 30) || "Generated Media") + "..."
                    : session.title
              };
              StorageService.saveSession(updatedSession);
              // Update session list in UI without full reload
              setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
          }
      }
  }, [messages, currentSessionId]);

  const toggleTheme = useCallback(() => {
      setTheme(prev => {
          const newTheme = prev === 'light' ? 'dark' : 'light';
          if (profile) {
              const updated: UserProfile = { 
                  ...profile, 
                  preferences: { 
                      ...profile.preferences, 
                      theme: newTheme 
                  } 
              };
              setProfile(updated);
              StorageService.saveProfile(updated);
          }
          return newTheme;
      });
  }, [profile]);

  // --- Session Management ---

  const createNewSession = useCallback((currentList = sessions) => {
      const newId = Date.now().toString();
      const newSession: ConversationSession = {
          id: newId,
          title: 'New Chat',
          messages: [],
          lastModified: Date.now(),
          preview: ''
      };
      setSessions([newSession, ...currentList]);
      setCurrentSessionId(newId);
      setMessages([]);
      StorageService.saveSession(newSession);
      StorageService.setLastSessionId(newId);
      setViewMode(ViewMode.CHAT);
      if (isMobile) setSidebarOpen(false);
  }, [sessions, isMobile]);

  const loadSession = useCallback((id: string) => {
      const session = sessions.find(s => s.id === id);
      if (session) {
          setCurrentSessionId(id);
          setMessages(session.messages);
          StorageService.setLastSessionId(id);
          setViewMode(ViewMode.CHAT);
          if (isMobile) setSidebarOpen(false);
      }
  }, [sessions, isMobile]);

  const handleDeleteSession = useCallback((id: string) => {
      StorageService.deleteSession(id);
      setSessions(prev => {
          const newSessions = prev.filter(s => s.id !== id);
          if (currentSessionId === id) {
              if (newSessions.length > 0) {
                  loadSession(newSessions[0].id);
              } else {
                  createNewSession(newSessions);
              }
          }
          return newSessions;
      });
  }, [currentSessionId, loadSession, createNewSession]);

  // --- Feature Handlers ---

  const saveGeneratedMedia = (url: string, type: 'image' | 'video', prompt: string) => {
      const newItem: SavedCreation = {
          id: Date.now().toString(),
          type,
          url,
          prompt,
          timestamp: Date.now(),
          aspectRatio: config.aspectRatio
      };
      setLibrary(prev => [newItem, ...prev]);
      StorageService.saveToLibrary(newItem);
  };

  const handleProfileSave = (p: UserProfile) => {
      setProfile(p);
      StorageService.saveProfile(p);
      if (p.preferences.theme) setTheme(p.preferences.theme);
      alert("Profile saved successfully!");
  };

  const handleAttach = async (files: FileList) => {
    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await blobToBase64(file);
      newAttachments.push({
        file,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
        base64Data: base64
      });
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleSend = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;
    
    setIsProcessing(true);
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: inputValue,
      attachments: attachments,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setAttachments([]);

    // Optimistic Title Update for New Chat
    if (messages.length === 0 && currentSessionId) {
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: userMsg.text?.slice(0, 30) || "Media" } : s));
    }

    try {
        const responseId = (Date.now() + 1).toString();
        let responseMsg: ChatMessage = {
            id: responseId,
            role: MessageRole.MODEL,
            timestamp: Date.now(),
            isThinking: config.thinkingMode
        };

        // Add placeholder immediately
        setMessages(prev => [...prev, responseMsg]);

        if (mode === AppMode.IMAGE_GEN) {
            const resp = await GeminiService.generateImage(userMsg.text || "Image", config);
            let imgUrl = '';
            for(const part of resp.candidates?.[0]?.content?.parts || []) {
                if(part.inlineData) {
                    imgUrl = `data:image/png;base64,${part.inlineData.data}`;
                }
            }
            if(imgUrl) {
                const media = [{ type: 'image' as const, url: imgUrl, mimeType: 'image/png' }];
                responseMsg = {
                    ...responseMsg,
                    text: "Here is your generated image.",
                    generatedMedia: media,
                    isThinking: false
                };
                saveGeneratedMedia(imgUrl, 'image', userMsg.text || "Generated Image");
            }
        } 
        else {
            const files = userMsg.attachments?.map(a => ({ mimeType: a.mimeType, data: a.base64Data! })) || [];
            const result = await GeminiService.generateChatResponse(userMsg.text || "", files, config);
            const text = result.text || "No response generated.";
            
            const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
            const sources = groundingChunks?.map((c: any) => {
                if (c.web) return { title: c.web.title, uri: c.web.uri };
                return null;
            }).filter(Boolean);

            const generatedImages: any[] = [];
            result.candidates?.[0]?.content?.parts?.forEach((p: any) => {
                 if (p.inlineData) {
                     const url = `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`;
                     generatedImages.push({ type: 'image', url, mimeType: p.inlineData.mimeType });
                     saveGeneratedMedia(url, 'image', userMsg.text?.slice(0,50) || "Inline Gen");
                 }
            });

            responseMsg = {
                ...responseMsg,
                text: text,
                groundingUrls: sources,
                generatedMedia: generatedImages.length > 0 ? generatedImages : undefined,
                isThinking: false
            };
        }

        // Update the placeholder with real data
        setMessages(prev => prev.map(m => m.id === responseId ? responseMsg : m));

    } catch (error: any) {
        console.error(error);
        const errMsg: ChatMessage = {
            id: Date.now().toString(),
            role: MessageRole.SYSTEM,
            text: `Error: ${error.message || "Something went wrong. Please try again."}`,
            timestamp: Date.now()
        };
        // Remove the placeholder if it exists (loading state) and add error
        setMessages(prev => {
             const filtered = prev.filter(m => !m.isThinking); // simplistic removal of stuck loading
             return [...filtered, errMsg];
        });
    } finally {
        setIsProcessing(false);
    }
  };

  const playAudioChunk = async (buffer: ArrayBuffer) => {
      if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const int16Data = new Int16Array(buffer);
      const audioBuffer = ctx.createBuffer(1, int16Data.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for(let i=0; i<int16Data.length; i++) {
          channelData[i] = int16Data[i] / 32768.0;
      }
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      const currentTime = ctx.currentTime;
      if (nextAudioTimeRef.current < currentTime) {
          nextAudioTimeRef.current = currentTime;
      }
      source.start(nextAudioTimeRef.current);
      nextAudioTimeRef.current += audioBuffer.duration;
  };

  const toggleLive = async () => {
      if (isLive) {
          if (liveDisconnectRef.current) {
              await liveDisconnectRef.current();
              liveDisconnectRef.current = null;
          }
          setIsLive(false);
      } else {
          setIsLive(true);
          setMode(AppMode.LIVE);
          try {
              const connection = await GeminiService.connectLive(
                  (data) => playAudioChunk(data),
                  () => setIsLive(false)
              );
              liveDisconnectRef.current = connection.disconnect;
          } catch (e) {
              console.error(e);
              setIsLive(false);
              alert("Failed to connect to Live API. Check permissions.");
          }
      }
  };

  const ModeButton = ({ active, label, icon, onClick }: any) => (
    <button 
      onClick={onClick}
      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap ${
        active 
        ? 'bg-blue-100 dark:bg-blue-600/20 border-blue-200 dark:border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm' 
        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500 hover:text-gray-700 dark:hover:text-slate-200'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className={theme}>
        <div className="flex h-screen bg-slate-50 dark:bg-gemini-dark text-gray-900 dark:text-white font-sans overflow-hidden selection:bg-blue-200 dark:selection:bg-blue-500/30">
        
        {/* Sidebar */}
        <Sidebar 
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            currentView={viewMode}
            onChangeView={setViewMode}
            sessions={sessions}
            currentSessionId={currentSessionId || ''}
            onSelectSession={loadSession}
            onNewChat={createNewSession}
            onDeleteSession={handleDeleteSession}
            isMobile={isMobile}
        />

        {/* Main Content Wrapper */}
        <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${(!isMobile && sidebarOpen) ? 'ml-72' : 'ml-0'}`}>
            
            {/* Header */}
            <header className="flex-none h-16 px-4 border-b border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-gemini-dark/90 backdrop-blur flex items-center justify-between z-10 relative">
                <div className="flex items-center space-x-3">
                <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 -ml-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Toggle Sidebar"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                
                <h1 className="font-bold text-lg tracking-tight text-gray-900 dark:text-white truncate">
                    {viewMode === ViewMode.LIBRARY ? 'Media Library' : viewMode === ViewMode.PROFILE ? 'Profile' : 'Gemini Omni'}
                </h1>
                </div>
                
                <div className="flex items-center space-x-2 md:space-x-3">
                    <button 
                        onClick={toggleTheme}
                        className="p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
                    </button>

                    <button onClick={() => { setShareItem(null); setShareModalOpen(true); }} className="flex items-center space-x-1 text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 px-3 py-2 rounded-full border border-gray-200 dark:border-slate-700 transition-colors">
                        <ShareIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Share</span>
                    </button>

                    {viewMode === ViewMode.CHAT && (
                    <div className="hidden md:block text-[10px] text-gray-500 dark:text-slate-500 px-2 py-1 border border-gray-200 dark:border-slate-800 rounded bg-gray-50 dark:bg-slate-900 font-mono">
                        {config.thinkingMode ? "3-PRO THINKING" : "GEMINI PRO"}
                    </div>
                    )}
                </div>
            </header>

            {/* Main View Switcher */}
            <main className="flex-1 overflow-hidden relative flex flex-col bg-slate-50 dark:bg-gemini-dark">
                
                {/* Chat View */}
                {viewMode === ViewMode.CHAT && (
                    <>
                        {/* Mode Toolbar */}
                        <div className="flex-none px-4 py-3 border-b border-gray-200 dark:border-slate-800 overflow-x-auto no-scrollbar bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm">
                            <div className="flex space-x-2 min-w-max items-center">
                                <ModeButton active={mode === AppMode.CHAT} label="Chat" icon={<SparkleIcon className="w-3 h-3"/>} onClick={() => setMode(AppMode.CHAT)} />
                                
                                <div className="w-px h-5 bg-gray-300 dark:bg-slate-700 mx-2"></div>
                                
                                <ModeButton active={config.thinkingMode} label="Think" icon={<BrainIcon className="w-3 h-3" />} onClick={() => setConfig(p => ({...p, thinkingMode: !p.thinkingMode}))} />
                                <ModeButton active={config.searchEnabled} label="Search" onClick={() => setConfig(p => ({...p, searchEnabled: !p.searchEnabled}))} />
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
                            {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-slate-500 space-y-6 opacity-80 px-6 text-center">
                                <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center">
                                    <SparkleIcon className="w-10 h-10 text-blue-500" />
                                </div>
                                <div className="space-y-2 max-w-md">
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Hello {profile?.name || 'Creator'}</h2>
                                    <p className="text-sm leading-relaxed">I'm your Gemini Omni assistant. I can chat, generate images, and help with complex tasks.</p>
                                </div>
                            </div>
                            )}
                            {messages.map(msg => <ChatMessageComponent key={msg.id} message={msg} />)}
                            
                            {/* Loading Skeleton (if processing and no placeholder active) */}
                            {isProcessing && !messages[messages.length-1]?.isThinking && messages[messages.length-1]?.role !== MessageRole.MODEL && (
                                <div className="flex justify-start animate-pulse pl-2">
                                    <div className="flex items-center space-x-2 bg-white dark:bg-gemini-panel px-4 py-3 rounded-2xl rounded-tl-none text-sm text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700/50 shadow-sm">
                                        <SparkleIcon className="w-4 h-4 animate-spin" />
                                        <span>Gemini is working...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={scrollEndRef} className="h-4" />
                        </div>

                        {/* Live Overlay */}
                        {isLive && (
                            <div className="absolute inset-0 z-20 bg-white/90 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center flex-col space-y-8 pointer-events-none">
                                <div className="relative">
                                    <div className="w-48 h-48 rounded-full bg-blue-500/20 animate-ping absolute inset-0"></div>
                                    <div className="w-48 h-48 rounded-full bg-purple-500/20 animate-pulse absolute inset-0 animation-delay-500"></div>
                                    <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-900/50">
                                        <SparkleIcon className="w-20 h-20 text-white" />
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white tracking-widest">LISTENING</h3>
                                    <p className="text-gray-500 dark:text-slate-400">Speak freely with Gemini Live</p>
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <div className="flex-none z-20 pb-safe">
                            <InputArea 
                            value={inputValue}
                            onChange={setInputValue}
                            onSend={handleSend}
                            isProcessing={isProcessing}
                            attachments={attachments}
                            onAttach={handleAttach}
                            onRemoveAttachment={(i) => setAttachments(p => p.filter((_, x) => x !== i))}
                            onStartLive={toggleLive}
                            isLive={isLive}
                            />
                        </div>
                    </>
                )}

                {/* Library View */}
                {viewMode === ViewMode.LIBRARY && (
                    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900/50">
                        <LibraryView 
                            items={library} 
                            onDelete={(id) => { StorageService.deleteFromLibrary(id); setLibrary(p => p.filter(i => i.id !== id)); }}
                            onShare={(item) => { setShareItem(item); setShareModalOpen(true); }}
                        />
                    </div>
                )}

                {/* Profile View */}
                {viewMode === ViewMode.PROFILE && (
                    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900/50">
                        <ProfileView profile={profile} onSave={handleProfileSave} />
                    </div>
                )}

            </main>
        </div>

        {/* Modals */}
        <ShareModal 
            isOpen={shareModalOpen} 
            onClose={() => setShareModalOpen(false)} 
            itemToShare={shareItem} 
        />
        </div>
    </div>
  );
}

export default App;