// Background box text (create step 4 + sheet Proficiencies tab): one line per pick, then the 3 perks.
// picks = { upbringing, lifestyle, outlook }, each { bio?, flavor, perk, state } or null. "bio" is the future 2nd-person line.
const LABELS = { upbringing: 'Upbringing', lifestyle: 'Lifestyle', outlook: 'Outlook' };

export function backgroundLines(picks) {
    const story = [];
    const perks = [];
    for (const key of Object.keys(LABELS)) {
        const o = picks[key];
        if (!o) continue;
        if (o.bio || o.flavor) story.push(o.bio || o.flavor);
        perks.push(`${LABELS[key]} perk: ${o.perk || (o.state ? `none (grants ${o.state})` : 'none')}`);
    }
    return { story, perks };
}