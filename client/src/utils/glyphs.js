// Paths to the sketch glyphs in /public/glyphs. Names are lower-cased; a missing glyph hides itself.
const ALIGNMENT_GLYPHS = { white: 'life', yellow: 'strengthen', green: 'freedom', blue: 'defense', grey: 'neutrality', red: 'offense', orange: 'restrict', purple: 'weaken', black: 'death' };
const slug = (name) => String(name ?? '').trim().toLowerCase().replace(/\s+/g, '-');

export const stateGlyph = (name) => `/glyphs/states/${slug(name)}.png`;
export const elementGlyph = (name) => `/glyphs/elements/${slug(name)}.png`;
export const classGlyph = (name) => `/glyphs/classes/${slug(name)}.png`;
// accepts "Green Magic" or "Green"
export const alignmentGlyph = (name) => `/glyphs/alignments/${ALIGNMENT_GLYPHS[slug(name).split('-')[0]] ?? slug(name)}.png`;
export const hideBrokenGlyph = (e) => { e.currentTarget.hidden = true; };
