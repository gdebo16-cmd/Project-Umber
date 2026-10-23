import { useEffect, useState } from 'react';
import { sendJson } from '../utils/api';

// Allowed options for the Ability Boost / Primordial Ascent rows, from POST /api/boost_options
// (the server's prerequisite, repeat-limit and stat-cap rules). Re-asks whenever the class, level,
// scores or picks change, and clears any boost pick that is no longer allowed.
// Returns { [feature key]: [options] }, or null until the first answer (or when not enabled).
function useBoostOptions({ enabled, classId, subclassId, level, scores, boostKeys, picks, setPicks }) {
    const [allowed, setAllowed] = useState(null);
    const boostPicks = Object.fromEntries(boostKeys.filter((k) => picks[k]?.length).map((k) => [k, picks[k]]));
    const body = enabled ? JSON.stringify({ class_id: classId, subclass_id: subclassId || null, level, scores, feature_choices: boostPicks }) : null;

    useEffect(() => {
        if (!body) return;
        let stale = false;
        sendJson('/api/boost_options', 'POST', JSON.parse(body))
            .then(({ options }) => {
                if (stale) return;
                setAllowed(options);
                setPicks((prev) => {
                    const bad = Object.keys(options).filter((k) => prev?.[k]?.[0] && !options[k].includes(prev[k][0]));
                    if (!bad.length) return prev;
                    const next = { ...prev };
                    for (const k of bad) delete next[k];
                    return next;
                });
            })
            .catch(() => { if (!stale) setAllowed(null); }); // unfiltered; the save still checks
        return () => { stale = true; };
    }, [body, setPicks]);

    return body ? allowed : null;
}

export default useBoostOptions;
