import { createContext, useContext } from 'react';

export const ContentContext = createContext(null);

export default function useContent() {
    return useContext(ContentContext);
}
