/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { BuildingConfig, BuildingType, WeatherType, TimeOfDayPhase } from './types';

// Map Settings
export const GRID_SIZE = 15;

// Game Settings
export const TICK_RATE_MS = 2000; // Game loop updates every 2 seconds
export const INITIAL_MONEY = 1000;

// Day-Night Cycle: Duration in real seconds for a full 24h day cycle at 1x speed
export const DAY_CYCLE_SECONDS = 72; // ~3s per in-game hour

export const WEATHERS: Record<WeatherType, { name: string; icon: string; description: string }> = {
  clear: { name: 'Clear', icon: '☀️', description: 'Sunny & calm island skies' },
  rain: { name: 'Rain', icon: '🌧️', description: 'Refreshing coastal rain' },
  storm: { name: 'Storm', icon: '⛈️', description: 'Thunderstorm & lightning' },
  fog: { name: 'Fog', icon: '🌫️', description: 'Dense marine mist' },
  snow: { name: 'Snow', icon: '❄️', description: 'Gentle winter snowfall' },
};

export const TIME_PHASES: Record<TimeOfDayPhase, { name: string; icon: string }> = {
  dawn: { name: 'Dawn', icon: '🌅' },
  day: { name: 'Day', icon: '☀️' },
  dusk: { name: 'Dusk', icon: '🌇' },
  night: { name: 'Night', icon: '🌙' },
};

export const BUILDINGS: Record<BuildingType, BuildingConfig> = {
  [BuildingType.None]: {
    type: BuildingType.None,
    cost: 0,
    name: 'Bulldoze',
    description: 'Clear a tile',
    color: '#ef4444', // Used for UI
    popGen: 0,
    incomeGen: 0,
  },
  [BuildingType.Road]: {
    type: BuildingType.Road,
    cost: 10,
    name: 'Road',
    description: 'Connects city & spawns diverse traffic',
    color: '#374151', // gray-700
    popGen: 0,
    incomeGen: 0,
  },
  [BuildingType.Residential]: {
    type: BuildingType.Residential,
    cost: 100,
    name: 'House',
    description: '+5 Pop/day',
    color: '#f87171', // red-400
    popGen: 5,
    incomeGen: 0,
  },
  [BuildingType.Commercial]: {
    type: BuildingType.Commercial,
    cost: 200,
    name: 'Shop',
    description: '+$15/day',
    color: '#60a5fa', // blue-400
    popGen: 0,
    incomeGen: 15,
  },
  [BuildingType.Industrial]: {
    type: BuildingType.Industrial,
    cost: 400,
    name: 'Factory',
    description: '+$40/day',
    color: '#facc15', // yellow-400
    popGen: 0,
    incomeGen: 40,
  },
  [BuildingType.Park]: {
    type: BuildingType.Park,
    cost: 50,
    name: 'Park',
    description: 'Looks nice.',
    color: '#4ade80', // green-400
    popGen: 1,
    incomeGen: 0,
  },
};