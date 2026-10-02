/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-white font-sans p-6 bg-black/30 backdrop-blur-sm transition-all duration-1000">
      <div className="max-w-md w-full bg-slate-900/90 p-8 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-xl relative overflow-hidden animate-fade-in">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
            <h1 className="text-5xl font-black mb-2 bg-gradient-to-br from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent tracking-tight">
            SkyMetropolis
            </h1>
            <p className="text-slate-400 mb-6 text-sm font-medium uppercase tracking-widest">
            Isometric 3D City Builder
            </p>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mb-6 shadow-inner space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <span className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-[10px]">🛣️</span>
                <span>Pave roads to spawn animated real-world vehicle traffic</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <span className="w-5 h-5 rounded-md bg-red-500/20 border border-red-500/40 text-red-300 flex items-center justify-center font-bold text-[10px]">🏡</span>
                <span>Zone housing, retail, and factories to grow citizen count</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <span className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-[10px]">🎯</span>
                <span>Fulfill city objectives to earn treasury expansion grants</span>
              </div>
            </div>

            <button 
              onClick={onStart}
              className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 transform transition-all hover:scale-[1.02] active:scale-[0.98] text-lg tracking-wide cursor-pointer"
            >
              Start Building
            </button>

            <div className="mt-8 text-center">
                <a 
                    href="https://x.com/ammaar" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-cyan-400 transition-colors font-mono group"
                >
                    <span>Created by</span>
                    <span className="font-bold group-hover:underline decoration-cyan-500/50 underline-offset-2">@ammaar</span>
                </a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;