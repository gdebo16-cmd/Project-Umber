import { useEffect, useState } from 'react';
import { ContentContext } from './useContent';

// Load a pack, using the saved copy if the server says nothing changed
async function loadPack(url, storageKey) {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    const headers = saved ? { 'If-None-Match': saved.version } : {};
    const res = await fetch(url, { headers });

    if (res.status === 304 && saved) return saved.data; // nothing changed
    if (!res.ok) throw new Error(`Content load failed: ${res.status}`);

    const data = await res.json();
    const version = res.headers.get('ETag');
    localStorage.setItem(storageKey, JSON.stringify({ version, data }));
    return data;
}

export function ContentProvider({ children }) {
    const [content, setContent] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadPack('/api/content', 'umberContent')
            .then(setContent)
            .catch(err => setError(err.message));
    }, []);

    return (
        <ContentContext.Provider value={{ content, error }}>
            {children}
        </ContentContext.Provider>
    );
}
