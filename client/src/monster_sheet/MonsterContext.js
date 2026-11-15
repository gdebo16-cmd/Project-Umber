import { createContext, useContext } from 'react';

// One shared box of monster data for the sheet, so tabs don't need it passed down by hand
export const MonsterContext = createContext(null);

// Any component inside the sheet calls useMonster() to get the shared data
export const useMonster = () => useContext(MonsterContext);
