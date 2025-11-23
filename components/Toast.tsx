
import React, { useEffect } from 'react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto-dismiss after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 animate-slide-up">
      <div className="max-w-md w-full backdrop-blur-2xl bg-white/95 dark:bg-slate-800/95 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border-l-4 border-red-500 p-5 flex items-start ring-1 ring-slate-900/5 dark:ring-white/10">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-red-500 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-bold text-slate-900 dark:text-white">System Notification</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button onClick={onClose} className="inline-flex text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-colors">
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
