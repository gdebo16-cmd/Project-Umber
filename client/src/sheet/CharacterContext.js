import { createContext, useContext } from 'react';

// One shared box of character data for the sheet, so tabs don't need it passed down by hand
export const CharacterContext = createContext(null);

// Any component inside the sheet calls useCharacter() to get the shared data
export const useCharacter = () => useContext(CharacterContext);
