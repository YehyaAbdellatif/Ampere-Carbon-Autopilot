import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-ampere-mint"></div>
        <p className="text-white mt-4 text-lg font-semibold">AI is thinking...</p>
      </div>
    </div>
  );
};