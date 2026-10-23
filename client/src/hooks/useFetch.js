import { useState, useEffect } from 'react';

function useFetch(url) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(url)
        .then((res) => {
            if(!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then((json) => { setData(json); setError(null); })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
        }, [url]);
    
    return {data, setData, loading, error };
}

export default useFetch;
