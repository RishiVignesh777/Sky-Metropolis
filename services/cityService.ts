/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { CityGoal, BuildingType, CityStats, Grid, NewsItem } from "../types";

// Progression milestones for city development
const GOAL_TEMPLATES: Array<(counts: Record<string, number>, stats: CityStats) => Omit<CityGoal, 'completed'> | null> = [
  // 1. Initial Road Network
  (counts) => {
    if ((counts[BuildingType.Road] || 0) < 3) {
      return {
        title: "Pave the Way",
        description: "Connect the island: construct at least 3 Road tiles for vehicle transit.",
        targetType: "building_count",
        buildingType: BuildingType.Road,
        targetValue: 3,
        reward: 100,
      };
    }
    return null;
  },

  // 2. Early Residential
  (counts) => {
    if ((counts[BuildingType.Residential] || 0) < 2) {
      return {
        title: "Welcome Settlers",
        description: "Build 2 Residential homes to house the island's first citizens.",
        targetType: "building_count",
        buildingType: BuildingType.Residential,
        targetValue: 2,
        reward: 150,
      };
    }
    return null;
  },

  // 3. First Population Milestone
  (_, stats) => {
    if (stats.population < 30) {
      return {
        title: "Growing Community",
        description: "Attract new residents and reach a total population of 30 citizens.",
        targetType: "population",
        targetValue: 30,
        reward: 200,
      };
    }
    return null;
  },

  // 4. Commercial Shop
  (counts) => {
    if ((counts[BuildingType.Commercial] || 0) < 1) {
      return {
        title: "Open for Business",
        description: "Construct a Commercial shop to generate recurring daily revenue.",
        targetType: "building_count",
        buildingType: BuildingType.Commercial,
        targetValue: 1,
        reward: 250,
      };
    }
    return null;
  },

  // 5. Urban Greenery
  (counts) => {
    if ((counts[BuildingType.Park] || 0) < 1) {
      return {
        title: "Island Greenery",
        description: "Build a Public Park to improve city quality of life.",
        targetType: "building_count",
        buildingType: BuildingType.Park,
        targetValue: 1,
        reward: 150,
      };
    }
    return null;
  },

  // 6. Industrial Engine
  (counts) => {
    if ((counts[BuildingType.Industrial] || 0) < 1) {
      return {
        title: "Industrial Kickstart",
        description: "Build an Industrial Factory to significantly boost daily tax income.",
        targetType: "building_count",
        buildingType: BuildingType.Industrial,
        targetValue: 1,
        reward: 350,
      };
    }
    return null;
  },

  // 7. Road Expansion
  (counts) => {
    if ((counts[BuildingType.Road] || 0) < 8) {
      return {
        title: "Transit Network",
        description: "Expand city streets to 8 Road tiles to support diverse vehicle traffic.",
        targetType: "building_count",
        buildingType: BuildingType.Road,
        targetValue: 8,
        reward: 200,
      };
    }
    return null;
  },

  // 8. Population 75
  (_, stats) => {
    if (stats.population < 75) {
      return {
        title: "Thriving Town",
        description: "Expand residential capacity to reach a population of 75 residents.",
        targetType: "population",
        targetValue: 75,
        reward: 400,
      };
    }
    return null;
  },

  // 9. Shopping District
  (counts) => {
    if ((counts[BuildingType.Commercial] || 0) < 3) {
      return {
        title: "Shopping District",
        description: "Establish 3 Commercial shops to create a vibrant downtown.",
        targetType: "building_count",
        buildingType: BuildingType.Commercial,
        targetValue: 3,
        reward: 350,
      };
    }
    return null;
  },

  // 10. Treasury Milestone
  (_, stats) => {
    if (stats.money < 2500) {
      return {
        title: "Fiscal Prosperity",
        description: "Grow city coffers to reach a treasury balance of $2,500.",
        targetType: "money",
        targetValue: 2500,
        reward: 500,
      };
    }
    return null;
  },

  // 11. Industrial Growth
  (counts) => {
    if ((counts[BuildingType.Industrial] || 0) < 3) {
      return {
        title: "Manufacturing Hub",
        description: "Construct 3 Industrial factories to maximize export earnings.",
        targetType: "building_count",
        buildingType: BuildingType.Industrial,
        targetValue: 3,
        reward: 500,
      };
    }
    return null;
  },

  // 12. Park System
  (counts) => {
    if ((counts[BuildingType.Park] || 0) < 3) {
      return {
        title: "Garden City",
        description: "Build 3 Public Parks to create scenic recreation spaces across town.",
        targetType: "building_count",
        buildingType: BuildingType.Park,
        targetValue: 3,
        reward: 300,
      };
    }
    return null;
  },

  // 13. Metropolis Population
  (_, stats) => {
    if (stats.population < 150) {
      return {
        title: "Bustling Metropolis",
        description: "Reach 150 citizens living peacefully on the island.",
        targetType: "population",
        targetValue: 150,
        reward: 750,
      };
    }
    return null;
  },

  // 14. Mega Treasury
  (_, stats) => {
    if (stats.money < 5000) {
      return {
        title: "Wealth of Nations",
        description: "Accumulate $5,000 in treasury reserves for civic legacy.",
        targetType: "money",
        targetValue: 5000,
        reward: 1000,
      };
    }
    return null;
  },
];

export const generateCityGoal = (stats: CityStats, grid: Grid, completedCount: number = 0): CityGoal => {
  const counts: Record<string, number> = {};
  grid.flat().forEach(tile => {
    if (tile.buildingType !== BuildingType.None) {
      counts[tile.buildingType] = (counts[tile.buildingType] || 0) + 1;
    }
  });

  // Check linear progression templates
  for (const template of GOAL_TEMPLATES) {
    const candidate = template(counts, stats);
    if (candidate) {
      return { ...candidate, completed: false };
    }
  }

  // Fallback procedural scaling goals when all milestones are achieved
  const nextPopTarget = Math.ceil((stats.population + 30) / 25) * 25;
  const nextMoneyTarget = Math.ceil((stats.money + 1000) / 500) * 500;

  if (completedCount % 2 === 0) {
    return {
      title: "Metropolis Expansion",
      description: `Expand the city to reach ${nextPopTarget} citizens.`,
      targetType: "population",
      targetValue: nextPopTarget,
      reward: 500,
      completed: false,
    };
  } else {
    return {
      title: "Treasury Growth",
      description: `Reach $${nextMoneyTarget.toLocaleString()} in the city treasury.`,
      targetType: "money",
      targetValue: nextMoneyTarget,
      reward: 600,
      completed: false,
    };
  }
};

// Rich local headline pool categorized by city state
const GENERAL_NEWS = [
  { text: "Morning sun reflects off the harbor waters as a new day begins in SkyMetropolis.", type: "neutral" as const },
  { text: "Island weather forecast: Clear skies and gentle coastal breezes throughout the week.", type: "positive" as const },
  { text: "City council convenes to review master urban zoning proposals.", type: "neutral" as const },
  { text: "Local architects praise the distinctive low-poly skyline aesthetic.", type: "positive" as const },
  { text: "Annual kite and balloon festival scheduled for the upcoming weekend.", type: "positive" as const },
  { text: "Sea gulls spotted riding thermals above the island perimeter.", type: "neutral" as const },
  { text: "Ferry captain reports calm waters and steady arrivals at the docks.", type: "positive" as const },
];

const TRAFFIC_NEWS = [
  { text: "Traffic report: Sedans, sports cars, and transit buses navigating streets smoothly.", type: "positive" as const },
  { text: "Yellow cabs report high passenger satisfaction across all downtown routes.", type: "positive" as const },
  { text: "Delivery trucks complete morning freight runs ahead of schedule.", type: "positive" as const },
  { text: "Police cruisers patrol avenues to ensure pedestrian and roadway safety.", type: "positive" as const },
  { text: "Commuter transit bus service receives commendation for punctual departures.", type: "positive" as const },
];

const RESIDENTIAL_NEWS = [
  { text: "Citizens celebrate opening of new residential neighborhood with block party.", type: "positive" as const },
  { text: "Local bakers report record morning sales of fresh bread to neighborhood families.", type: "positive" as const },
  { text: "New residents praise the clean island air and panoramic coastal views.", type: "positive" as const },
  { text: "Community volunteers organize neighborhood street cleanup and planting day.", type: "positive" as const },
];

const COMMERCIAL_NEWS = [
  { text: "Downtown shops report booming weekend sales as shoppers fill retail district.", type: "positive" as const },
  { text: "New coffee bistro opens on the corner; outdoor patio tables filled instantly.", type: "positive" as const },
  { text: "Local merchant association reports strong quarterly business revenue.", type: "positive" as const },
];

const INDUSTRIAL_NEWS = [
  { text: "Factory district operates at peak capacity; manufacturing output hits new high.", type: "positive" as const },
  { text: "Cargo logistics team coordinates freight shipments across the island network.", type: "neutral" as const },
  { text: "Industrial engineers implement modern filtration systems on factory stacks.", type: "positive" as const },
];

const PARK_NEWS = [
  { text: "Families and citizens enjoy sunny afternoons relaxing under park shade trees.", type: "positive" as const },
  { text: "City parks department reports thriving bird populations in urban green spaces.", type: "positive" as const },
  { text: "Fountain plaza becomes popular meeting spot for artists and musicians.", type: "positive" as const },
];

const LOW_FUNDS_NEWS = [
  { text: "City comptroller advises prudent spending until daily tax revenue replenishes reserves.", type: "negative" as const },
  { text: "Treasury funds tight; city hall prioritizes high-yield commercial investments.", type: "negative" as const },
];

export const generateCityNews = (stats: CityStats, grid: Grid): NewsItem => {
  const counts: Record<string, number> = {};
  grid.flat().forEach(tile => {
    if (tile.buildingType !== BuildingType.None) {
      counts[tile.buildingType] = (counts[tile.buildingType] || 0) + 1;
    }
  });

  const pool: Array<{ text: string; type: "positive" | "negative" | "neutral" }> = [...GENERAL_NEWS];

  if ((counts[BuildingType.Road] || 0) >= 2) {
    pool.push(...TRAFFIC_NEWS);
  }
  if ((counts[BuildingType.Residential] || 0) >= 1) {
    pool.push(...RESIDENTIAL_NEWS);
  }
  if ((counts[BuildingType.Commercial] || 0) >= 1) {
    pool.push(...COMMERCIAL_NEWS);
  }
  if ((counts[BuildingType.Industrial] || 0) >= 1) {
    pool.push(...INDUSTRIAL_NEWS);
  }
  if ((counts[BuildingType.Park] || 0) >= 1) {
    pool.push(...PARK_NEWS);
  }
  if (stats.money < 150) {
    pool.push(...LOW_FUNDS_NEWS);
  }

  const selected = pool[Math.floor(Math.random() * pool.length)];

  return {
    id: Date.now().toString() + Math.random().toString().slice(2, 6),
    text: selected.text,
    type: selected.type,
  };
};
