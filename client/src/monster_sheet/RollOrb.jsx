import { useEffect, useRef, useState } from 'react';

// The floating orb that shows your last roll. Drag it anywhere; tap it to open or close.
// "open" and "label" come from CharacterSheet, so any roll on the sheet can pop it open.
// Touch (phones) and mouse (computers) are handled separately, because iPhone Safari
// is unreliable with pointer events on a fixed element.
function RollOrb({ open, onToggle, rolls = [] }) {
    const [position, setPosition] = useState(null); // { left, top } once you've dragged it
    const [dragging, setDragging] = useState(false);
    const orbRef = useRef(null);
    const drag = useRef(null); // where the drag started
    const toggleRef = useRef(onToggle);
    useEffect(() => { toggleRef.current = onToggle; }, [onToggle]); // keep the latest toggle without writing a ref during render
    const [flip, setFlip] = useState({ left: false, up: false }); // which way the open panel grows
    const feedRef = useRef(null);
    const atBottom = useRef(true); // is the feed scrolled to the newest roll?
    const [showJump, setShowJump] = useState(false); // new roll arrived while scrolled up
    const feedScrolled = useRef(false); // did the current touch/click scroll the feed?

    const scrollToBottom = () => {
        const el = feedRef.current;
        if (el) el.scrollTop = el.scrollHeight;
        atBottom.current = true;
        setShowJump(false);
    };

    // Opening the orb always starts at the newest roll
    useEffect(() => { if (open) requestAnimationFrame(() => scrollToBottom()); }, [open]);

    // A new roll: follow it if you're at the bottom, otherwise show the arrow
    useEffect(() => {
        if (!open || rolls.length === 0) return;
        requestAnimationFrame(() => { // after the new bubble is drawn
            if (atBottom.current) scrollToBottom();
            else setShowJump(true);
        });
    }, [rolls, open]);

    const onFeedScroll = () => {
        const el = feedRef.current;
        feedScrolled.current = true; // this gesture was a scroll, not a tap
        atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 8; // within 8px counts as bottom
        if (atBottom.current) setShowJump(false);
    };

    // When it opens (or moves), check which half of the screen the orb is in.
    // Right half: grow to the left. Bottom half: grow upward. That keeps the panel on screen.
    useEffect(() => {
        if (!open || !orbRef.current) return;
        const rect = orbRef.current.getBoundingClientRect();
        const centerX = rect.left + 24; // the closed orb is 3rem (48px) wide, so +24 is its middle
        const centerY = rect.top + 24;
        setFlip({ left: centerX > window.innerWidth / 2, up: centerY > window.innerHeight / 2 });
    }, [open, position]);

    // keep the closed orb (48px) fully on screen
    const clamp = (left, top) => ({
        left: Math.min(Math.max(0, left), window.innerWidth - 48),
        top: Math.min(Math.max(0, top), window.innerHeight - 48),
    });

    // if the window shrinks (rotating a phone), pull the orb back on screen
    useEffect(() => {
        const onResize = () => setPosition((p) => (p ? clamp(p.left, p.top) : p));
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // shared helpers for both touch and mouse
    const start = (x, y) => {
        const rect = orbRef.current.getBoundingClientRect();
        drag.current = { startX: x, startY: y, left: rect.left, top: rect.top, moved: false };
        setDragging(true);
    };
    const move = (x, y) => {
        if (!drag.current) return;
        const dx = x - drag.current.startX;
        const dy = y - drag.current.startY;
        // Fingers wiggle a few pixels during a tap, so only count it as a drag past 10px
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) drag.current.moved = true;
        if (!drag.current.moved) return;
        setPosition(clamp(drag.current.left + dx, drag.current.top + dy));
    };
    const end = () => {
        if (!drag.current) return;
        const wasDrag = drag.current.moved;
        drag.current = null;
        setDragging(false);
        if (!wasDrag) toggleRef.current(); // a tap, not a drag
    };

    // Touch: native listeners so we can call preventDefault (stops page scroll and the extra click)
    useEffect(() => {
        const el = orbRef.current;
        const inFeed = (e) => e.target.closest('.roll-feed, .roll-jump'); // let the feed scroll instead of dragging the orb
        const onTouchStart = (e) => { if (inFeed(e)) return; e.preventDefault(); const t = e.touches[0]; start(t.clientX, t.clientY); };
        const onTouchMove = (e) => { if (inFeed(e)) return; e.preventDefault(); const t = e.touches[0]; move(t.clientX, t.clientY); };
        const onTouchEnd = (e) => { if (inFeed(e)) return; e.preventDefault(); end(); };
        const onTouchCancel = () => { if (drag.current) { drag.current = null; setDragging(false); } };
        el.addEventListener('touchstart', onTouchStart, { passive: false });
        el.addEventListener('touchmove', onTouchMove, { passive: false });
        el.addEventListener('touchend', onTouchEnd, { passive: false });
        el.addEventListener('touchcancel', onTouchCancel);
        return () => {
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchmove', onTouchMove);
            el.removeEventListener('touchend', onTouchEnd);
            el.removeEventListener('touchcancel', onTouchCancel);
        };
    }, []);

    // Mouse: follow the mouse on the whole window so fast drags don't slip off the orb
    const onMouseDown = (e) => {
        if (e.button !== 0 || e.target.closest('.roll-feed, .roll-jump')) return;
        start(e.clientX, e.clientY);
        const onMove = (ev) => move(ev.clientX, ev.clientY);
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            end();
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const classes = ['roll-orb', 'btn-round', open && 'is-open', dragging && 'is-dragging', open && flip.left && 'opens-left', open && flip.up && 'opens-up'].filter(Boolean).join(' ');

    return (
        <div
            ref={orbRef}
            id="rollOrb"
            className={classes}
            role="button"
            tabIndex={0}
            aria-expanded={open}
            aria-label="Open Roll Panel"
            style={position ? { left: `${position.left}px`, top: `${position.top}px`, right: 'auto' } : undefined}
            onMouseDown={onMouseDown}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        >
            <div className="roll-orb-face" aria-hidden="true"></div>
            <div className="roll-orb-panel" hidden={!open}>
                <ul className="roll-feed" ref={feedRef} onScroll={onFeedScroll}
                    onPointerDown={() => { feedScrolled.current = false; }}
                    onClick={() => { if (!feedScrolled.current) onToggle(); }}>
                {rolls.map((r) => (
                    <li key={r.at + r.label} className={r.mine ? 'roll-bubble is-sent' : 'roll-bubble is-received'}>
                    {!r.mine && <span className="roll-bubble-name">{r.name}</span>}
                    {r.label}
                    </li>
                ))}
                </ul>
                {showJump && (
                    <button type="button" className="roll-jump btn-round" aria-label="Jump to newest roll" onClick={scrollToBottom}>{'\u2193'}</button>
                )}            </div>
        </div>
    );
}

export default RollOrb;