import React from 'react';

interface HeaderProps {
  isDeveloperMode: boolean;
  setIsDeveloperMode: (isDevMode: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ isDeveloperMode, setIsDeveloperMode }) => {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-ampere-navy/95 border-b border-white/10 transition-all duration-500 shadow-navy">
      <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center space-x-4 cursor-pointer select-none group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-ampere-mint/20 to-ampere-blue/20 border border-white/20 group-hover:border-ampere-mint/50 transition-colors shadow-[0_0_15px_rgba(0,221,179,0.1)]">
             {/* Updated Logo: Shield Check instead of Bolt to represent audit/validation */}
             <svg className="w-6 h-6 text-ampere-mint drop-shadow-[0_0_8px_rgba(0,221,179,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-display font-bold tracking-tight text-white leading-none group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-ampere-mint group-hover:to-ampere-blue transition-all duration-300">
              Ampere
            </h1>
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-slate-200 group-hover:text-ampere-mint transition-colors duration-300 mt-1">
              Carbon Audit Autopilot
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-6">
           {/* Dev Mode Toggle */}
          <div 
            onClick={() => setIsDeveloperMode(!isDeveloperMode)}
            className={`flex items-center cursor-pointer p-1.5 pr-4 rounded-full border transition-all duration-300 group/switch ${
              isDeveloperMode 
                ? 'bg-slate-800/90 border-ampere-mint/50 shadow-[0_0_15px_rgba(0,221,179,0.2)]' 
                : 'bg-slate-900/60 border-slate-600 hover:bg-slate-800/80'
            }`}
          >
             <div className={`relative w-10 h-6 rounded-full transition-colors duration-300 ease-in-out ${isDeveloperMode ? 'bg-ampere-mint' : 'bg-slate-500'}`}>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isDeveloperMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
             </div>
             <span className={`ml-3 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${isDeveloperMode ? 'text-white' : 'text-slate-200 group-hover/switch:text-white'}`}>
               Developer Mode
             </span>
          </div>
        </div>
      </div>
    </header>
  );
};