import React, { useState, useEffect } from 'react';

const messages = {
  findings: [
    "Scanning project documentation...",
    "Evaluating compliance matrix...",
    "Detecting gaps in evidence...",
    "Formulating technical findings...",
    "Validating standard references...",
    "Generating output stream...",
  ],
  report: [
    "Synthesizing data points...",
    "Structuring narrative flow...",
    "Aligning with audit protocol...",
    "Drafting executive summary...",
    "Formatting technical sections...",
    "Finalizing document structure...",
  ],
  response: [
    "Analyzing stakeholder input...",
    "Contextualizing project data...",
    "Drafting diplomatic response...",
    "Verifying technical accuracy...",
    "Polishing tone and style...",
    "Finalizing output...",
  ]
};

interface ThinkingBarProps {
  context: 'findings' | 'report' | 'response';
}

export const ThinkingBar: React.FC<ThinkingBarProps> = ({ context }) => {
  const activeMessages = messages[context];
  const [message, setMessage] = useState(activeMessages[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setMessage(activeMessages[0]);
    setProgress(0);

    const msgInterval = setInterval(() => {
      setMessage(prev => {
        const currentIndex = activeMessages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % activeMessages.length;
        return activeMessages[nextIndex];
      });
    }, 2500);

    const progInterval = setInterval(() => {
      setProgress(p => (p >= 100 ? 0 : p + 1));
    }, 50);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progInterval);
    };
  }, [activeMessages]);

  return (
    <div className="my-6 p-6 bg-white rounded-[2rem] border-t-4 border-ampere-mint shadow-xl shadow-slate-900/10 relative overflow-hidden group">
      {/* Scanning Grid Background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ampere-mint opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-ampere-mint"></span>
            </span>
            <p className="text-sm font-mono font-bold text-slate-800 animate-pulse">{message}</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">AI Processing</span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden relative">
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-ampere-mint to-ampere-green shadow-[0_0_10px_rgba(0,221,179,0.5)] transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
          {/* Scanner Line */}
          <div className="absolute top-0 bottom-0 w-20 bg-white/80 blur-md animate-shimmer" style={{ left: `${progress}%` }}></div>
        </div>

        <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span>Initializing</span>
          <span>Processing Data</span>
          <span>Compiling</span>
        </div>
      </div>
    </div>
  );
};