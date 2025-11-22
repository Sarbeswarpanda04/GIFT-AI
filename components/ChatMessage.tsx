import React, { useMemo } from 'react';
import { ChatMessage as ChatMessageType, MessageRole } from '../types';
import { SparkleIcon, BrainIcon } from './Icons';

interface ChatMessageProps {
  message: ChatMessageType;
}

const MarkdownRenderer = ({ content }: { content: string }) => {
  // 1. Handle Code Blocks (```code```)
  const blocks = useMemo(() => content.split(/(```[\s\S]*?```)/g), [content]);

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => {
        if (block.startsWith('```') && block.endsWith('```')) {
          // Extract content
          const inner = block.slice(3, -3);
          const firstNewLine = inner.indexOf('\n');
          const lang = firstNewLine > -1 ? inner.slice(0, firstNewLine).trim() : '';
          const code = firstNewLine > -1 ? inner.slice(firstNewLine + 1) : inner;

          return (
            <div key={index} className="my-3 rounded-lg overflow-hidden bg-[#1e1e1e] border border-gray-800 shadow-md">
              {lang && (
                <div className="bg-[#2d2d2d] px-3 py-1.5 text-xs text-gray-400 border-b border-gray-700 font-mono flex items-center justify-between">
                  <span className="uppercase">{lang}</span>
                </div>
              )}
              <div className="p-3 overflow-x-auto">
                <pre className="text-sm font-mono text-[#d4d4d4] whitespace-pre">
                  <code>{code}</code>
                </pre>
              </div>
            </div>
          );
        }
        // Render Inline Markdown for non-code-block parts
        return <InlineMarkdown key={index} text={block} />;
      })}
    </div>
  );
};

const InlineMarkdown = ({ text }: { text: string }) => {
  // Filter out empty strings to prevent empty paragraphs
  if (!text) return null;
  
  // Split by double newline to preserve paragraphs
  const paragraphs = text.split(/\n\n+/g);

  return (
    <>
      {paragraphs.map((paragraph, pIdx) => (
        <p key={pIdx} className="whitespace-pre-wrap mb-2 last:mb-0 leading-relaxed">
           {renderRichText(paragraph)}
        </p>
      ))}
    </>
  );
};

// Helper to render **bold**, *italic*, `code`
const renderRichText = (text: string) => {
  // We split by the most complex token first: Inline Code, then Bold, then Italic
  // Regex captures the delimiter content to keep it in the array
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, i) => {
    // Inline Code
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-[0.9em] font-mono text-pink-600 dark:text-pink-400 mx-0.5">
          {part.slice(1, -1)}
        </code>
      );
    }
    // Bold
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    // Italic
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    // Plain text
    return part;
  });
};


export const ChatMessage: React.FC<ChatMessageProps> = React.memo(({ message }) => {
  const isModel = message.role === MessageRole.MODEL;

  return (
    <div className={`flex w-full mb-6 ${isModel ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] lg:max-w-[75%] ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 md:h-9 md:w-9 rounded-full flex items-center justify-center mx-2 mt-1 ${isModel ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20' : 'bg-gray-200 dark:bg-slate-700'}`}>
          {isModel ? <SparkleIcon className="w-5 h-5 text-white" /> : <span className="text-[10px] font-bold tracking-wider text-gray-600 dark:text-gray-300">YOU</span>}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col p-3 md:p-5 rounded-2xl ${isModel ? 'bg-white dark:bg-gemini-panel rounded-tl-none border border-gray-200 dark:border-slate-800' : 'bg-blue-600 rounded-tr-none'} text-gray-900 dark:text-gemini-text shadow-sm dark:shadow-md overflow-hidden w-full min-w-0`}>
          
          {/* Attachments (User uploaded) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.attachments.map((att, idx) => (
                <div key={idx} className="relative group overflow-hidden rounded-lg border border-white/20 dark:border-white/10 bg-black/5">
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

          {/* Text Content with Markdown */}
          {message.text && (
             <div className={`text-[15px] md:text-[16px] break-words ${isModel ? 'text-gray-800 dark:text-slate-200' : 'text-white'}`}>
               {isModel ? <MarkdownRenderer content={message.text} /> : <p className="whitespace-pre-wrap">{message.text}</p>}
             </div>
          )}

          {/* Generated Media */}
          {message.generatedMedia && message.generatedMedia.length > 0 && (
            <div className="mt-4 grid gap-4">
                {message.generatedMedia.map((media, idx) => (
                    <div key={idx} className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-black/40 shadow-lg">
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
            </div>
          )}

          {/* Grounding Sources */}
          {message.groundingUrls && message.groundingUrls.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700/50">
              <p className="text-[10px] text-gray-500 dark:text-slate-400 mb-2 font-bold uppercase tracking-wider">Sources</p>
              <div className="flex flex-wrap gap-2">
                {message.groundingUrls.map((src, idx) => (
                  <a key={idx} href={src.uri} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-300 px-2.5 py-1.5 rounded-md truncate max-w-[200px] transition-colors border border-gray-200 dark:border-slate-700">
                    <span className="truncate">{src.title || new URL(src.uri).hostname}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* Thinking Indicator */}
          {message.isThinking && (
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-slate-400 italic mt-2 animate-pulse bg-gray-100 dark:bg-slate-800/50 py-1 px-2 rounded-md self-start">
                  <BrainIcon className="w-3 h-3" />
                  <span>Reasoning...</span>
              </div>
          )}

        </div>
      </div>
    </div>
  );
});