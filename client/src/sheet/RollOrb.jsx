import { useEffect, useRef, useState } from 'react';

// The floating orb that shows your last roll. Drag it anywhere; tap it to open or close.
// "open" and "label" come from CharacterSheet, so any roll on the sheet can pop it open.
// Touch (phones) and mouse (computers) are handled separately, because iPhone Safari
// is unreliable with pointer events on a fixed element.
function RollOrb({ open, label, onToggle }) {
    const [position, setPosition] = useState(null); // { left, top } once you've dragged it
    const [dragging, setDragging] = useState(false);
    const orbRef = useRef(null);
    const drag = useRef(null); // where the drag started
    const toggleRef = useRef(onToggle);
    useEffect(() => { toggleRef.current = onToggle; }, [onToggle]); // keep the latest toggle without writing a ref during render

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
        setPosition({ left: drag.current.left + dx, top: drag.current.top + dy });
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
        const onTouchStart = (e) => { e.preventDefault(); const t = e.touches[0]; start(t.clientX, t.clientY); };
        const onTouchMove = (e) => { e.preventDefault(); const t = e.touches[0]; move(t.clientX, t.clientY); };
        const onTouchEnd = (e) => { e.preventDefault(); end(); };
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
        if (e.button !== 0) return;
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

    const classes = ['roll-orb', 'btn-round', open && 'is-open', dragging && 'is-dragging'].filter(Boolean).join(' ');

    return (
        <div
            ref={orbRef}
            id="rollOrb"
            className={classes}
            role="button"
            tabIndex={0}
            aria-expanded={open}
            aria-label="Open Roll Panel"
            style={position ? { left: `${position.left}px`, top: `${position.top}px` } : undefined}
            onMouseDown={onMouseDown}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        >
            <div className="roll-orb-face" aria-hidden="true"></div>
            <div className="roll-orb-panel" hidden={!open}>
                <p className="roll-orb-label">{label}</p>
                <p className="roll-orb-total"></p>
                <p className="roll-orb-detail"></p>
            </div>
        </div>
    );
}

export default RollOrb;