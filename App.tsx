/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Grid, TileData, BuildingType, CityStats, CityGoal, NewsItem, WeatherType, TimeOfDayPhase } from './types';
import { GRID_SIZE, BUILDINGS, TICK_RATE_MS, INITIAL_MONEY, DAY_CYCLE_SECONDS } from './constants';
import IsoMap from './components/IsoMap';
import UIOverlay from './components/UIOverlay';
import StartScreen from './components/StartScreen';
import { generateCityGoal, generateCityNews, generateWeatherNews, generateTimePhaseNews } from './services/cityService';

// Initialize empty grid with island shape generation for 3D visual interest
const createInitialGrid = (): Grid => {
  const grid: Grid = [];
  const center = GRID_SIZE / 2;

  for (let y = 0; y < GRID_SIZE; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({ x, y, buildingType: BuildingType.None });
    }
    grid.push(row);
  }
  return grid;
};

// Compute time-of-day phase from hour (0 to 24)
const getTimePhase = (h: number): TimeOfDayPhase => {
  if (h >= 5 && h < 7.5) return 'dawn';
  if (h >= 7.5 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
};

function App() {
  // --- Game State ---
  const [gameStarted, setGameStarted] = useState(false);

  const [grid, setGrid] = useState<Grid>(createInitialGrid);
  const [stats, setStats] = useState<CityStats>({ money: INITIAL_MONEY, population: 0, day: 1 });
  const [selectedTool, setSelectedTool] = useState<BuildingType>(BuildingType.Road);
  
  // --- Day-Night Cycle & Weather State ---
  const [time, setTime] = useState<number>(9.5); // Starts at 9:30 AM
  const [timeSpeed, setTimeSpeed] = useState<number>(1); // 0 = pause, 1 = normal, 2 = fast
  const [weather, setWeather] = useState<WeatherType>('clear');

  const phase = getTimePhase(time);

  // --- City Objectives & News State ---
  const [currentGoal, setCurrentGoal] = useState<CityGoal | null>(null);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  const completedGoalsCountRef = useRef(0);
  
  // Refs for accessing state inside intervals without dependencies
  const gridRef = useRef(grid);
  const statsRef = useRef(stats);
  const goalRef = useRef(currentGoal);
  const timeSpeedRef = useRef(timeSpeed);
  const weatherRef = useRef(weather);
  const lastPhaseRef = useRef<TimeOfDayPhase>(phase);

  // Sync refs
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { goalRef.current = currentGoal; }, [currentGoal]);
  useEffect(() => { timeSpeedRef.current = timeSpeed; }, [timeSpeed]);
  useEffect(() => { weatherRef.current = weather; }, [weather]);

  // --- News & Goal Handlers ---

  const addNewsItem = useCallback((item: NewsItem) => {
    setNewsFeed(prev => [...prev.slice(-12), item]); // Keep last few
  }, []);

  const fetchNewGoal = useCallback(() => {
    const newGoal = generateCityGoal(statsRef.current, gridRef.current, completedGoalsCountRef.current);
    if (newGoal) {
      setCurrentGoal(newGoal);
    }
  }, []); 

  const fetchNews = useCallback(() => {
    // Occasional city news
    if (Math.random() > 0.3) return; 
    const news = generateCityNews(statsRef.current, gridRef.current);
    if (news) addNewsItem(news);
  }, [addNewsItem]);

  // --- Initial Setup ---
  useEffect(() => {
    if (!gameStarted) return;

    addNewsItem({ 
      id: Date.now().toString(), 
      text: "Welcome to SkyMetropolis. Terrain generation complete. Start building roads and zoning structures.", 
      type: 'positive' 
    });
    
    fetchNewGoal();
  }, [gameStarted, addNewsItem, fetchNewGoal]);

  // --- Day-Night Cycle & Natural Weather Engine ---
  useEffect(() => {
    if (!gameStarted) return;

    const intervalMs = 200;
    // In DAY_CYCLE_SECONDS (72s), 24 in-game hours pass at 1x speed.
    const baseHourStep = (24 / DAY_CYCLE_SECONDS) * (intervalMs / 1000);

    const timer = setInterval(() => {
      const speed = timeSpeedRef.current;
      if (speed <= 0) return;

      setTime(prevTime => {
        let newTime = prevTime + baseHourStep * speed;
        let dayIncrement = 0;

        if (newTime >= 24) {
          newTime = newTime % 24;
          dayIncrement = 1;
        }

        // Check if day-night phase transitioned
        const newPhase = getTimePhase(newTime);
        if (newPhase !== lastPhaseRef.current) {
          lastPhaseRef.current = newPhase;
          addNewsItem(generateTimePhaseNews(newPhase));

          // At dawn (sunrise), 40% chance of weather forecast update
          if (newPhase === 'dawn' && Math.random() < 0.4) {
            const weatherKeys: WeatherType[] = ['clear', 'clear', 'rain', 'storm', 'fog', 'snow'];
            const nextW = weatherKeys[Math.floor(Math.random() * weatherKeys.length)];
            if (nextW !== weatherRef.current) {
              setWeather(nextW);
              addNewsItem(generateWeatherNews(nextW));
            }
          }
        }

        // Increment calendar day at midnight
        if (dayIncrement > 0) {
          setStats(s => ({ ...s, day: s.day + 1 }));
        }

        return newTime;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [gameStarted, addNewsItem]);

  // --- Game Loop (Economy & Citizen Growth) ---
  useEffect(() => {
    if (!gameStarted) return;

    const intervalId = setInterval(() => {
      // 1. Calculate income/pop gen
      let dailyIncome = 0;
      let dailyPopGrowth = 0;
      let buildingCounts: Record<string, number> = {};

      gridRef.current.flat().forEach(tile => {
        if (tile.buildingType !== BuildingType.None) {
          const config = BUILDINGS[tile.buildingType];
          dailyIncome += config.incomeGen;
          dailyPopGrowth += config.popGen;
          buildingCounts[tile.buildingType] = (buildingCounts[tile.buildingType] || 0) + 1;
        }
      });

      // Cap population growth by residential count
      const resCount = buildingCounts[BuildingType.Residential] || 0;
      const maxPop = resCount * 50;

      // 2. Update Stats
      setStats(prev => {
        let newPop = prev.population + dailyPopGrowth;
        if (newPop > maxPop) newPop = maxPop;
        if (resCount === 0 && prev.population > 0) newPop = Math.max(0, prev.population - 5);

        const newStats = {
          money: prev.money + dailyIncome,
          population: newPop,
          day: prev.day, // Day increments on midnight pass in day-night cycle
        };
        
        // 3. Check Goal Completion
        const goal = goalRef.current;
        if (goal && !goal.completed) {
          let isMet = false;
          if (goal.targetType === 'money' && newStats.money >= goal.targetValue) isMet = true;
          if (goal.targetType === 'population' && newStats.population >= goal.targetValue) isMet = true;
          if (goal.targetType === 'building_count' && goal.buildingType) {
            if ((buildingCounts[goal.buildingType] || 0) >= goal.targetValue) isMet = true;
          }

          if (isMet) {
            setCurrentGoal({ ...goal, completed: true });
          }
        }

        return newStats;
      });

      // 4. Trigger news
      fetchNews();

    }, TICK_RATE_MS);

    return () => clearInterval(intervalId);
  }, [fetchNews, gameStarted]);

  // --- Interaction Logic ---

  const handleTileClick = useCallback((x: number, y: number) => {
    if (!gameStarted) return;

    const currentGrid = gridRef.current;
    const currentStats = statsRef.current;
    const tool = selectedTool;
    
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

    const currentTile = currentGrid[y][x];
    const buildingConfig = BUILDINGS[tool];

    // Bulldoze logic
    if (tool === BuildingType.None) {
      if (currentTile.buildingType !== BuildingType.None) {
        const demolishCost = 5;
        if (currentStats.money >= demolishCost) {
            const newGrid = currentGrid.map(row => [...row]);
            newGrid[y][x] = { ...currentTile, buildingType: BuildingType.None };
            setGrid(newGrid);
            setStats(prev => ({ ...prev, money: prev.money - demolishCost }));
        } else {
            addNewsItem({id: Date.now().toString(), text: "Cannot afford demolition costs.", type: 'negative'});
        }
      }
      return;
    }

    // Placement Logic
    if (currentTile.buildingType === BuildingType.None) {
      if (currentStats.money >= buildingConfig.cost) {
        setStats(prev => ({ ...prev, money: prev.money - buildingConfig.cost }));
        
        const newGrid = currentGrid.map(row => [...row]);
        newGrid[y][x] = { ...currentTile, buildingType: tool };
        setGrid(newGrid);
      } else {
        addNewsItem({id: Date.now().toString() + Math.random(), text: `Treasury insufficient for ${buildingConfig.name}.`, type: 'negative'});
      }
    }
  }, [selectedTool, addNewsItem, gameStarted]);

  const handleClaimReward = () => {
    if (currentGoal && currentGoal.completed) {
      completedGoalsCountRef.current += 1;
      setStats(prev => ({ ...prev, money: prev.money + currentGoal.reward }));
      addNewsItem({
        id: Date.now().toString(), 
        text: `Objective fulfilled! $${currentGoal.reward} grant deposited into city treasury.`, 
        type: 'positive'
      });
      setCurrentGoal(null);
      setTimeout(fetchNewGoal, 300);
    }
  };

  const handleStart = () => {
    setGameStarted(true);
  };

  // Weather & Time Controls
  const handleTogglePlayPause = useCallback(() => {
    setTimeSpeed(prev => (prev === 0 ? 1 : 0));
  }, []);

  const handleSetTimeSpeed = useCallback((speed: number) => {
    setTimeSpeed(speed);
  }, []);

  const handleSetTime = useCallback((newHour: number) => {
    const clamped = Math.max(0, Math.min(23.99, newHour));
    setTime(clamped);
    const newPhase = getTimePhase(clamped);
    lastPhaseRef.current = newPhase;
    addNewsItem(generateTimePhaseNews(newPhase));
  }, [addNewsItem]);

  const handleSetWeather = useCallback((newW: WeatherType) => {
    setWeather(newW);
    addNewsItem(generateWeatherNews(newW));
  }, [addNewsItem]);

  return (
    <div className="relative w-screen h-screen overflow-hidden selection:bg-transparent selection:text-transparent bg-slate-950">
      {/* 3D Rendering Layer with Dynamic Day-Night & Weather */}
      <IsoMap 
        grid={grid} 
        onTileClick={handleTileClick} 
        hoveredTool={selectedTool}
        population={stats.population}
        time={time}
        phase={phase}
        weather={weather}
      />
      
      {/* Start Screen Overlay */}
      {!gameStarted && (
        <StartScreen onStart={handleStart} />
      )}

      {/* UI Layer */}
      {gameStarted && (
        <UIOverlay
          stats={stats}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          currentGoal={currentGoal}
          newsFeed={newsFeed}
          onClaimReward={handleClaimReward}
          time={time}
          phase={phase}
          weather={weather}
          timeSpeed={timeSpeed}
          onTogglePlayPause={handleTogglePlayPause}
          onSetTimeSpeed={handleSetTimeSpeed}
          onSetTime={handleSetTime}
          onSetWeather={handleSetWeather}
        />
      )}

      {/* CSS for animations and utility */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .mask-image-b { -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%); mask-image: linear-gradient(to bottom, transparent 0%, black 15%); }
        
        /* Vertical text for toolbar label */
        .writing-mode-vertical { writing-mode: vertical-rl; text-orientation: mixed; }
        
        /* Custom scrollbar for news */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}

export default App;