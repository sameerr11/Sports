import React from 'react';
import { 
  SportsSoccer, // Football
  SportsBasketball, // Basketball
  SportsVolleyball, // Volleyball
  SportsMartialArts, // Martial Arts / Self Defense / Karate
  FitnessCenter, // Gym and general fitness
  DirectionsRun, // Zumba
  Pool, // Swimming
  TableBar, // Ping Pong / Table Tennis (replacing SportsTable)
  SportsGymnastics, // Gymnastics
  Sports // Generic sports icon for others
} from '@mui/icons-material';

/**
 * Returns the appropriate Material-UI icon component for a given sport type
 * @param {string} sportType - The type of sport
 * @returns {JSX.Element} The appropriate icon component
 */
export const getSportIcon = (sportType) => {
  if (!sportType) return <Sports />;
  
  switch(sportType.toLowerCase()) {
    case 'football':
    case 'soccer':
      return <SportsSoccer />;
    case 'basketball':
      return <SportsBasketball />;
    case 'volleyball':
      return <SportsVolleyball />;
    case 'self defense':
    case 'karate':
      return <SportsMartialArts />;
    case 'gymnastics':
      return <SportsGymnastics />;
    case 'gym':
      return <FitnessCenter />;
    case 'zumba':
      return <DirectionsRun />;
    case 'swimming':
      return <Pool />;
    case 'ping pong':
    case 'table tennis':
      return <TableBar />;
    case 'fitness':
      return <FitnessCenter />;
    case 'crossfit':
      return <FitnessCenter />;
    default:
      return <Sports />;
  }
}; 