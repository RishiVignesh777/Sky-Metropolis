/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState } from 'react';
import { BuildingType, CityStats, CityGoal, NewsItem, WeatherType, TimeOfDayPhase } from '../types';
import { BUILDINGS, WEATHERS, TIME_PHASES } from '../constants';

interface UIOverlayProps {
  stats: CityStats;
  selectedTool: BuildingType;
  onSelectTool: (type: BuildingType) => void;
  currentGoal: CityGoal | null;
  newsFeed: NewsItem[];
  onClaimReward: () => void;
  time: number;
  phase: TimeOfDayPhase;
  weather: WeatherType;
  timeSpeed: number;
  onTogglePlayPause: () => void;
  onSetTimeSpeed: (speed: number) => void;
  onSetTime: (time: number) => void;
  onSetWeather: (weather: WeatherType) => void;
}

const tools = [
  BuildingType.None, // Bulldoze
  BuildingType.Road,
  BuildingType.Residential,
  BuildingType.Commercial,
  BuildingType.Industrial,
  BuildingType.Park,
];

const ToolButton: React.FC<{
  type: BuildingType;
  isSelected: boolean;
  onClick: () => void;
  money: number;
}> = ({ type, isSelected, onClick, money }) => {
  const config = BUILDINGS[type];
  const canAfford = money >= config.cost;
  const isBulldoze = type === BuildingType.None;
  
  // Use 3D color for preview
  const bgColor = isBulldoze ? config.color : config.color;

  return (
    <button
      onClick={onClick}
      disabled={!isBulldoze && !canAfford}
      className={`
        relative flex flex-col items-center justify-center rounded-lg border-2 transition-all shadow-lg backdrop-blur-sm flex-shrink-0
        w-14 h-14 md:w-16 md:h-16
        ${isSelected ? 'border-white bg-white/20 scale-110 z-10' : 'border-gray-600 bg-gray-900/80 hover:bg-gray-800'}
        ${!isBulldoze && !canAfford ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={config.description}
    >
      <div className="w-6 h-6 md:w-8 md:h-8 rounded mb-0.5 md:mb-1 border border-black/30 shadow-inner flex items-center justify-center overflow-hidden" style={{ backgroundColor: isBulldoze ? 'transparent' : bgColor }}>
        {isBulldoze && <div className="w-full h-full bg-red-600 text-white flex justify-center items-center font-bold text-base md:text-lg">✕</div>}
        {type === BuildingType.Road && (
          <div className="relative w-full h-full bg-gray-700 flex items-center justify-center overflow-hidden">
            <div className="absolute w-full h-1 bg-amber-400 border-b border-amber-500"></div>
            <div className="relative z-10 w-4 h-2.5 bg-red-500 rounded-xs shadow flex items-center justify-between px-0.5">
              <div className="w-1 h-1.5 bg-sky-200 rounded-xs opacity-90"></div>
              <div className="w-0.5 h-1 bg-amber-200 rounded-xs"></div>
            </div>
          </div>
        )}
      </div>
      <span className="text-[8px] md:text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md leading-none">{config.name}</span>
      {config.cost > 0 && (
        <span className={`text-[8px] md:text-[10px] font-mono leading-none ${canAfford ? 'text-green-300' : 'text-red-400'}`}>${config.cost}</span>
      )}
    </button>
  );
};

const UIOverlay: React.FC<UIOverlayProps> = ({
  stats,
  selectedTool,
  onSelectTool,
  currentGoal,
  newsFeed,
  onClaimReward,
  time,
  phase,
  weather,
  timeSpeed,
  onTogglePlayPause,
  onSetTimeSpeed,
  onSetTime,
  onSetWeather,
}) => {
  const newsRef = useRef<HTMLDivElement>(null);
  const [showEnvControls, setShowEnvControls] = useState(false);

  // Auto-scroll news
  useEffect(() => {
    if (newsRef.current) {
      newsRef.current.scrollTop = newsRef.current.scrollHeight;
    }
  }, [newsFeed]);

  // Format 12-hour clock
  const hours = Math.floor(time);
  const minutes = Math.floor((time % 1) * 60);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  const timeString = `${h12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;

  const weatherConfig = WEATHERS[weather] || WEATHERS.clear;
  const phaseConfig = TIME_PHASES[phase] || TIME_PHASES.day;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 md:p-4 font-sans z-10">
      
      {/* Top Bar: Stats, Weather/Time, & Goal */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start pointer-events-auto gap-2 w-full max-w-full">
        
        {/* Left: Stats & Time/Weather Pill */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          {/* City Stats */}
          <div className="bg-gray-900/90 text-white p-2 md:p-3 rounded-xl border border-gray-700 shadow-2xl backdrop-blur-md flex gap-3 md:gap-5 items-center justify-between sm:justify-start">
            <div className="flex flex-col">
              <span className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-widest">Treasury</span>
              <span className="text-lg md:text-2xl font-black text-green-400 font-mono drop-shadow-md">${stats.money.toLocaleString()}</span>
            </div>
            <div className="w-px h-6 md:h-8 bg-gray-700"></div>
            <div className="flex flex-col">
              <span className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-widest">Citizens</span>
              <span className="text-base md:text-xl font-bold text-blue-300 font-mono drop-shadow-md">{stats.population.toLocaleString()}</span>
            </div>
            <div className="w-px h-6 md:h-8 bg-gray-700"></div>
            <div className="flex flex-col items-end">
               <span className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-widest">Day</span>
               <span className="text-base md:text-lg font-bold text-white font-mono">{stats.day}</span>
            </div>
          </div>

          {/* Time & Weather Controller Pill */}
          <div className="relative">
            <div className="bg-slate-900/90 text-white p-2 md:p-3 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md flex items-center justify-between gap-2.5">
              {/* Clock & Phase */}
              <div 
                onClick={() => setShowEnvControls(prev => !prev)}
                className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity"
                title="Click to toggle weather & time controls"
              >
                <span className="text-sm md:text-base">{phaseConfig.icon}</span>
                <div className="flex flex-col">
                  <span className="text-[9px] md:text-[10px] text-amber-300 font-mono font-bold leading-tight">{timeString}</span>
                  <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider leading-none">{phaseConfig.name}</span>
                </div>
              </div>

              <div className="w-px h-6 bg-slate-700"></div>

              {/* Weather Icon & Name */}
              <div 
                onClick={() => setShowEnvControls(prev => !prev)}
                className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity"
                title="Click to change weather"
              >
                <span className="text-base md:text-lg">{weatherConfig.icon}</span>
                <span className="text-[10px] md:text-xs font-bold text-slate-200">{weatherConfig.name}</span>
              </div>

              <div className="w-px h-6 bg-slate-700"></div>

              {/* Play / Pause / Speed buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={onTogglePlayPause}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${timeSpeed === 0 ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                  title={timeSpeed === 0 ? "Resume Time" : "Pause Time"}
                >
                  {timeSpeed === 0 ? '▶' : '⏸'}
                </button>
                <button
                  onClick={() => onSetTimeSpeed(timeSpeed === 1 ? 2 : 1)}
                  className={`px-1.5 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold transition-all cursor-pointer ${timeSpeed === 2 ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                  title="Toggle 1x / 2x Speed"
                >
                  {timeSpeed === 2 ? '2x' : '1x'}
                </button>
                <button
                  onClick={() => setShowEnvControls(prev => !prev)}
                  className={`w-6 h-6 rounded flex items-center justify-center text-[11px] transition-all cursor-pointer ${showEnvControls ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                  title="Weather & Time Presets"
                >
                  ⚙️
                </button>
              </div>
            </div>

            {/* Quick Environment Controls Dropdown */}
            {showEnvControls && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900/95 border border-slate-700 rounded-xl p-3 shadow-2xl backdrop-blur-xl z-50 text-white animate-fade-in">
                <div className="flex justify-between items-center mb-2.5 pb-1 border-b border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Weather & Environment</span>
                  <button 
                    onClick={() => setShowEnvControls(false)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Weather Selectors */}
                <div className="mb-3">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block mb-1">Weather Condition</span>
                  <div className="grid grid-cols-5 gap-1">
                    {(Object.keys(WEATHERS) as WeatherType[]).map((wKey) => {
                      const cfg = WEATHERS[wKey];
                      const active = weather === wKey;
                      return (
                        <button
                          key={wKey}
                          onClick={() => onSetWeather(wKey)}
                          className={`flex flex-col items-center justify-center py-1.5 rounded-lg border text-xs transition-all cursor-pointer ${active ? 'bg-cyan-600/40 border-cyan-400 text-white shadow-sm' : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-300'}`}
                          title={cfg.description}
                        >
                          <span>{cfg.icon}</span>
                          <span className="text-[8px] font-medium leading-none mt-0.5">{cfg.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time of Day Presets */}
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block mb-1">Time of Day</span>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: 'Dawn', time: 6, icon: '🌅' },
                      { label: 'Noon', time: 12, icon: '☀️' },
                      { label: 'Dusk', time: 18, icon: '🌇' },
                      { label: 'Night', time: 23, icon: '🌙' },
                    ].map((t) => (
                      <button
                        key={t.label}
                        onClick={() => onSetTime(t.time)}
                        className="flex flex-col items-center justify-center py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition-all cursor-pointer"
                      >
                        <span>{t.icon}</span>
                        <span className="text-[8px] font-medium leading-none mt-0.5">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: City Objective Panel */}
        <div className="w-full md:w-80 bg-slate-900/95 text-white rounded-xl border-2 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)] backdrop-blur-md overflow-hidden transition-all">
          <div className="bg-indigo-950/90 px-3 md:px-4 py-1.5 md:py-2 flex justify-between items-center border-b border-indigo-700/60">
            <span className="font-bold uppercase text-[10px] md:text-xs tracking-widest flex items-center gap-2 shadow-sm text-indigo-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              City Objective
            </span>
            {currentGoal && (
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-600/40 px-2 py-0.5 rounded">
                +${currentGoal.reward}
              </span>
            )}
          </div>
          
          <div className="p-3 md:p-4">
            {currentGoal ? (
              <>
                {currentGoal.title && (
                  <h4 className="text-xs font-bold text-cyan-300 mb-1">{currentGoal.title}</h4>
                )}
                <p className="text-xs md:text-sm font-medium text-slate-200 mb-2 leading-tight">
                  {currentGoal.description}
                </p>
                
                <div className="flex justify-between items-center mt-2 bg-slate-950/70 p-2 rounded-lg border border-slate-700/60">
                  <div className="text-[10px] md:text-xs text-slate-300">
                    Target: <span className="font-mono font-bold text-white">
                      {currentGoal.targetType === 'building_count' ? BUILDINGS[currentGoal.buildingType!].name : 
                       currentGoal.targetType === 'money' ? '$' : 'Pop.'} {currentGoal.targetValue.toLocaleString()}
                    </span>
                  </div>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${currentGoal.completed ? 'bg-emerald-900/70 text-emerald-300 border border-emerald-500' : 'bg-slate-800 text-slate-400'}`}>
                    {currentGoal.completed ? 'COMPLETED' : 'IN PROGRESS'}
                  </div>
                </div>

                {currentGoal.completed && (
                  <button
                    onClick={onClaimReward}
                    className="mt-3 w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold py-2 px-4 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all animate-pulse text-xs md:text-sm uppercase tracking-wide border border-emerald-400/60 cursor-pointer"
                  >
                    Claim +${currentGoal.reward} Reward
                  </button>
                )}
              </>
            ) : (
              <div className="text-xs text-slate-400 py-1 italic">All current objectives fulfilled!</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar: Tools & News */}
      <div className="flex flex-col-reverse md:flex-row md:justify-between md:items-end pointer-events-auto mt-auto gap-2 w-full max-w-full">
        
        {/* Toolbar - Reversed on Mobile so it appears below News (in DOM order is News -> Toolbar with col-reverse, but visually we want Toolbar bottom, News Top on mobile. 
            Actually, visually we want:
            Mobile: 
            [News Feed]
            [Toolbar]
            
            Desktop:
            [Toolbar] ... [News Feed]
            
            If container is flex-col-reverse:
            1. Child (Toolbar) -> Bottom
            2. Child (News) -> Top
            
            If container is md:flex-row:
            1. Child (Toolbar) -> Left
            2. Child (News) -> Right
            
            This works perfectly.
        */}
        
        <div className="flex gap-1 md:gap-2 bg-gray-900/80 p-1 md:p-2 rounded-2xl border border-gray-600/50 backdrop-blur-xl shadow-2xl w-full md:w-auto overflow-x-auto no-scrollbar justify-start md:justify-start">
          <div className="flex gap-1 md:gap-2 min-w-max px-1">
            {tools.map((type) => (
              <ToolButton
                key={type}
                type={type}
                isSelected={selectedTool === type}
                onClick={() => onSelectTool(type)}
                money={stats.money}
              />
            ))}
          </div>
          <div className="text-[8px] text-gray-500 uppercase writing-mode-vertical flex items-center justify-center font-bold tracking-widest border-l border-gray-700 pl-1 ml-1 select-none">Build</div>
        </div>

        {/* News Feed */}
        <div className="w-full md:w-80 h-32 md:h-48 bg-black/80 text-white rounded-xl border border-gray-700/80 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden relative">
          <div className="bg-gray-800/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-300 border-b border-gray-600 flex justify-between items-center">
            <span>City Feed</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          
          {/* Scanline effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-30 z-20"></div>
          
          <div ref={newsRef} className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2 text-[10px] md:text-xs font-mono scroll-smooth mask-image-b z-10">
            {newsFeed.length === 0 && <div className="text-gray-500 italic text-center mt-10">No active news stream.</div>}
            {newsFeed.map((news) => (
              <div key={news.id} className={`
                border-l-2 pl-2 py-1 transition-all animate-fade-in leading-tight relative
                ${news.type === 'positive' ? 'border-green-500 text-green-200 bg-green-900/20' : ''}
                ${news.type === 'negative' ? 'border-red-500 text-red-200 bg-red-900/20' : ''}
                ${news.type === 'neutral' ? 'border-blue-400 text-blue-100 bg-blue-900/20' : ''}
              `}>
                <span className="opacity-70 text-[8px] absolute top-0.5 right-1">{new Date(Number(news.id.split('.')[0])).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                {news.text}
              </div>
            ))}
          </div>
        </div>

      </div>
      
      {/* Credits */}
      <div className="absolute bottom-1 right-2 md:right-4 text-[8px] md:text-[9px] text-white/30 font-mono text-right pointer-events-auto hover:text-white/60 transition-colors">
        <a href="https://x.com/ammaar" target="_blank" rel="noreferrer">Created by @ammaar</a>
      </div>
    </div>
  );
};

export default UIOverlay;