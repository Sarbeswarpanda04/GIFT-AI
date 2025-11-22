import React from 'react';
import { ChatMessage as ChatMessageType, MessageRole } from '../types';
import { SparkleIcon, BrainIcon } from './Icons';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === MessageRole.MODEL;

  return (
    <div className={`flex w-full mb-4 ${isModel ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] lg:max-w-[75%] ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 md:h-9 md:w-9 rounded-full flex items-center justify-center mx-2 mt-1 ${isModel ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20' : 'bg-gray-200 dark:bg-slate-700'}`}>
          {isModel ? <SparkleIcon className="w-5 h-5 text-white" /> : <span className="text-[10px] font-bold tracking-wider text-gray-600 dark:text-gray-300">YOU</span>}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col p-3 md:p-4 rounded-2xl ${isModel ? 'bg-white dark:bg-gemini-panel rounded-tl-none border border-gray-200 dark:border-slate-800' : 'bg-blue-600 rounded-tr-none'} text-gray-900 dark:text-gemini-text shadow-sm dark:shadow-md overflow-hidden`}>
          
          {/* Attachments (User uploaded) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.attachments.map((att, idx) => (
                <div key={idx} className="relative group overflow-hidden rounded-lg border border-white/20 dark:border-white/10">
                  {att.mimeType.startsWith('image/') ? (
                    <img src={att.previewUrl} alt="attachment" className="w-24 h-24 object-cover" />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center bg-black/10 dark:bg-black/20 text-xs text-center p-2 break-all text-white">
                      {att.file.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Text Content */}
          {message.text && (
             <div className={`text-[15px] md:text-[16px] leading-relaxed whitespace-pre-wrap break-words ${isModel ? 'text-gray-800 dark:text-slate-200' : 'text-white'}`}>
               {message.text}
             </div>
          )}

          {/* Generated Media */}
          {message.generatedMedia && message.generatedMedia.map((media, idx) => (
            <div key={idx} className="mt-4 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-black/40 shadow-lg">
              {media.type === 'image' && (
                <img src={media.url} alt="Generated" className="w-full h-auto max-h-[500px] object-contain" />
              )}
              {media.type === 'video' && (
                 <video src={media.url} controls autoPlay loop muted className="w-full h-auto max-h-[500px]" />
              )}
              {media.type === 'audio' && (
                 <audio src={media.url} controls className="w-full mt-1" />
              )}
            </div>
          ))}

          {/* Grounding Sources */}
          {message.groundingUrls && message.groundingUrls.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700/50">
              <p className="text-[10px] text-gray-500 dark:text-slate-400 mb-2 font-bold uppercase tracking-wider">Sources</p>
              <div className="flex flex-wrap gap-2">
                {message.groundingUrls.map((src, idx) => (
                  <a key={idx} href={src.uri} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-300 px-2.5 py-1.5 rounded-md truncate max-w-[200px] transition-colors border border-gray-200 dark:border-slate-700">
                    <span className="truncate">{src.title || new URL(src.uri).hostname}</span>
                    <svg className="w-3 h-3 opacity-50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* Thinking Indicator */}
          {message.isThinking && (
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-slate-400 italic mt-2 animate-pulse">
                  <BrainIcon className="w-3 h-3" />
                  <span>Reasoning...</span>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};