import React, { useRef } from 'react';
import { AttachmentIcon, MicIcon, SendIcon, StopIcon } from './Icons';
import { Attachment } from '../types';

interface InputAreaProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  isProcessing: boolean;
  attachments: Attachment[];
  onAttach: (files: FileList) => void;
  onRemoveAttachment: (index: number) => void;
  onStartLive: () => void;
  isLive: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({
  value,
  onChange,
  onSend,
  isProcessing,
  attachments,
  onAttach,
  onRemoveAttachment,
  onStartLive,
  isLive
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
      // Reset height
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const adjustHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <div className="bg-white/90 dark:bg-gemini-panel/90 backdrop-blur-md border-t border-gray-200 dark:border-slate-700 p-3 md:p-4 sticky bottom-0">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex gap-3 mb-3 overflow-x-auto pb-2 px-1 no-scrollbar">
          {attachments.map((att, i) => (
            <div key={i} className="relative flex-shrink-0 group">
              <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 overflow-hidden flex items-center justify-center shadow-md">
                 {att.mimeType.startsWith('image') ? (
                   <img src={att.previewUrl} className="w-full h-full object-cover" alt="preview" />
                 ) : (
                   <span className="text-[10px] p-1 text-center break-all text-gray-500 dark:text-slate-400">{att.file.name.slice(0,15)}</span>
                 )}
              </div>
              <button
                onClick={() => onRemoveAttachment(i)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm hover:scale-110 transition-transform"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 md:gap-3 bg-gray-50 dark:bg-slate-800/80 p-2 rounded-3xl border border-gray-200 dark:border-slate-700 focus-within:border-blue-400 dark:focus-within:border-gemini-purple/50 focus-within:ring-1 focus-within:ring-blue-200 dark:focus-within:ring-gemini-purple/20 transition-all shadow-sm">
        {/* File Input */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-gray-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-slate-700/50 rounded-full transition-colors flex-shrink-0"
          title="Upload"
        >
          <AttachmentIcon className="w-6 h-6" />
        </button>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => e.target.files && onAttach(e.target.files)}
          accept="image/*,video/*,audio/*" 
        />

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={adjustHeight}
          onKeyDown={handleKeyDown}
          placeholder={isLive ? "Listening..." : "Ask Gemini..."}
          disabled={isLive || isProcessing}
          className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 text-[16px] md:text-base p-2.5 outline-none resize-none max-h-32 min-h-[44px] leading-relaxed"
          rows={1}
        />

        <div className="flex items-center gap-1 pb-1">
            {/* Live Toggle */}
            <button
            onClick={onStartLive}
            className={`p-2.5 rounded-full transition-all flex-shrink-0 ${isLive ? 'bg-red-500 text-white animate-pulse shadow-red-500/30 shadow-lg' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700/50'}`}
            title={isLive ? "Stop Live" : "Start Live"}
            >
                {isLive ? <StopIcon className="w-5 h-5" /> : <MicIcon className="w-6 h-6" />}
            </button>

            {/* Send Button */}
            <button
            onClick={onSend}
            disabled={(!value.trim() && attachments.length === 0) || isProcessing || isLive}
            className={`p-2.5 rounded-full transition-all flex-shrink-0 ${
                (!value.trim() && attachments.length === 0) || isProcessing || isLive
                ? 'text-gray-400 dark:text-slate-600 cursor-not-allowed bg-gray-200 dark:bg-slate-800'
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 dark:shadow-blue-900/30 hover:scale-105'
            }`}
            >
            <SendIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};