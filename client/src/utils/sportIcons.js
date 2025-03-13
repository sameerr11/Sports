import React from 'react';
import { 
  SportsSoccer, // Football
  SportsCricket, // Cricket
  SportsBasketball, // Basketball
  SportsTennis, // Tennis
  SportsVolleyball, // Volleyball
  SportsRugby, // Rugby
  SportsHockey, // Hockey
  SportsBaseball, // Baseball
  SportsEsports, // Esports
  DirectionsRun, // Athletics/Running
  Pool, // Swimming
  SportsMartialArts, // Martial Arts
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
    case 'cricket':
      return <SportsCricket />;
    case 'basketball':
      return <SportsBasketball />;
    case 'tennis':
      return <SportsTennis />;
    case 'volleyball':
      return <SportsVolleyball />;
    case 'rugby':
      return <SportsRugby />;
    case 'hockey':
      return <SportsHockey />;
    case 'baseball':
      return <SportsBaseball />;
    case 'esports':
    case 'gaming':
      return <SportsEsports />;
    case 'athletics':
    case 'running':
      return <DirectionsRun />;
    case 'swimming':
      return <Pool />;
    case 'martial arts':
    case 'karate':
    case 'judo':
    case 'taekwondo':
      return <SportsMartialArts />;
    default:
      return <Sports />;
  }
}; 