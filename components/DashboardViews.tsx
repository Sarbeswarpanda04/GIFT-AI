import React, { useState, useEffect } from 'react';
import { UserProfile, SavedCreation, ASPECT_RATIOS, IMAGE_SIZES } from '../types';
import { ShareIcon, TrashIcon, UsersIcon } from './Icons';

// --- Profile View ---
interface ProfileViewProps {
    profile: UserProfile | null;
    onSave: (p: UserProfile) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onSave }) => {
    const [formData, setFormData] = useState<UserProfile>(profile || {
        id: 'user_' + Date.now(),
        name: '',
        email: '',
        bio: '',
        preferences: { autoSave: true, theme: 'light' }
    });

    const handleChange = (field: keyof UserProfile, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
            
            <div className="bg-white dark:bg-slate-800/50 p-4 md:p-6 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-5 shadow-sm">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500 dark:text-slate-400">Display Name</label>
                    <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Enter your name"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500 dark:text-slate-400">Email Address</label>
                    <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="your@email.com"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500 dark:text-slate-400">Bio / System Instructions</label>
                    <textarea 
                        value={formData.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none transition-all"
                        placeholder="Tell Gemini about yourself or how you prefer answers..."
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-gray-200 dark:border-slate-700 gap-4">
                    <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-slate-300 cursor-pointer w-full sm:w-auto hover:text-blue-600 dark:hover:text-white">
                        <input 
                           type="checkbox" 
                           checked={formData.preferences.autoSave} 
                           onChange={(e) => setFormData(p => ({...p, preferences: {...p.preferences, autoSave: e.target.checked}}))}
                           className="w-5 h-5 rounded bg-gray-200 dark:bg-slate-700 border-gray-300 dark:border-slate-500 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Auto-save conversations</span>
                    </label>
                    
                    <button 
                        onClick={() => onSave(formData)}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Library View ---
interface LibraryViewProps {
    items: SavedCreation[];
    onDelete: (id: string) => void;
    onShare: (item: SavedCreation) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ items, onDelete, onShare }) => {
    return (
        <div className="p-4 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Creative Library <span className="text-lg text-gray-500 dark:text-slate-500 font-normal ml-2">{items.length}</span></h2>
            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-slate-500 border-2 border-dashed border-gray-300 dark:border-slate-800 rounded-2xl">
                    <p>No saved creations yet.</p>
                    <p className="text-sm">Start generating images or videos!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {items.map(item => (
                        <div key={item.id} className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-900/10">
                             <div className="aspect-square bg-gray-100 dark:bg-black relative">
                                 {item.type === 'image' ? (
                                     <img src={item.url} alt="creation" className="w-full h-full object-cover" />
                                 ) : (
                                     <video src={item.url} className="w-full h-full object-cover" controls={false} muted />
                                 )}
                                 
                                 {/* Overlay Actions */}
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 backdrop-blur-[2px]">
                                     <button onClick={() => onShare(item)} className="p-3 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform shadow-lg" title="Share">
                                         <ShareIcon className="w-5 h-5" />
                                     </button>
                                     <button onClick={() => onDelete(item.id)} className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg" title="Delete">
                                         <TrashIcon className="w-5 h-5" />
                                     </button>
                                 </div>
                             </div>
                             <div className="p-4">
                                 <p className="text-sm text-gray-900 dark:text-white line-clamp-2 mb-2 font-medium">{item.prompt}</p>
                                 <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">
                                     <span className="bg-gray-100 dark:bg-slate-900 px-2 py-1 rounded">{item.type}</span>
                                     <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                 </div>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Collaboration Modal ---
interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemToShare?: SavedCreation | null; // If null, sharing session
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, itemToShare }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    // Close on escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if(e.key === 'Escape') onClose();
        };
        if(isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSend = () => {
        if (!email) return;
        setStatus('sending');
        // Mock API delay
        setTimeout(() => {
            setStatus('sent');
            setTimeout(() => {
                setStatus('idle');
                setEmail('');
                onClose();
            }, 1500);
        }, 1000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div 
              className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 w-full max-w-md p-6 relative shadow-2xl transform transition-all animate-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-full text-blue-600 dark:text-blue-400">
                        <UsersIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {itemToShare ? 'Share Creation' : 'Invite Collaborators'}
                    </h3>
                </div>
                
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                    {itemToShare 
                        ? "Generate a public link for this creation to share it with others." 
                        : "Invite team members to this conversation workspace for real-time collaboration."}
                </p>

                <div className="space-y-5">
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase mb-1.5 block tracking-wider">Email Address</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl p-3 text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center justify-between group cursor-pointer" onClick={() => alert("Link copied!")}>
                        <span className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-[200px] font-mono">
                            {itemToShare ? `link.gemini.app/s/${itemToShare.id.slice(0,8)}` : `link.gemini.app/join/${Date.now().toString(36)}`}
                        </span>
                        <span className="text-xs text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 font-bold uppercase tracking-wider">Copy Link</span>
                    </div>

                    <button 
                        onClick={handleSend}
                        disabled={status !== 'idle' || !email}
                        className={`w-full py-3.5 rounded-xl font-medium transition-all transform active:scale-[0.98] ${
                            status === 'sent' 
                            ? 'bg-green-500 text-white' 
                            : status === 'sending'
                                ? 'bg-gray-400 dark:bg-slate-600 text-white dark:text-slate-300'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-900/30'
                        }`}
                    >
                        {status === 'sent' ? 'Invitation Sent!' : status === 'sending' ? 'Sending Invite...' : 'Send Invite'}
                    </button>
                </div>
            </div>
        </div>
    );
};