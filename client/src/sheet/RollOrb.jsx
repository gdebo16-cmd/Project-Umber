import { useRef, useState } from 'react';

// The floating orb that shows your last roll. Drag it anywhere; tap it to open or close.
// "open" and "label" come from CharacterSheet, so any roll on the sheet can pop it open.
function RollOrb({ open, label, onToggle }) {
    const [position, setPosition] = useState(null); // { left, top } once you've dragged it
    const [dragging, setDragging] = useState(false);
    const drag = useRef(null); // where the drag started (a ref, because it doesn't need to redraw)

    const onPointerDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        drag.current = { startX: e.clientX, startY: e.clientY, left: rect.left, top: rect.top, moved: false };
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
    };

    const onPointerMove = (e) => {
        if (!drag.current) return;
        const dx = e.clientX - drag.current.startX;
        const dy = e.clientY - drag.current.startY;
        // Fingers wiggle a few pixels during a tap, so only count it as a drag past 10px
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) drag.current.moved = true;
        if (!drag.current.moved) return; // still a tap: do not nudge the orb
        setPosition({ left: drag.current.left + dx, top: drag.current.top + dy });
    };

    const onPointerUp = () => {
        if (!drag.current) return;
        const wasDrag = drag.current.moved;
        drag.current = null;
        setDragging(false);
        if (!wasDrag) onToggle(); // a tap, not a drag
    };

    const classes = ['roll-orb', open && 'is-open', dragging && 'is-dragging'].filter(Boolean).join(' ');

    return (
        <div
            id="rollOrb"
            className={classes}
            role="button"
            tabIndex={0}
            aria-expanded={open}
            aria-label="Open Roll Panel"
            style={position ? { left: `${position.left}px`, top: `${position.top}px` } : undefined}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
        >
            <div className="roll-orb-face" aria-hidden="true"></div>
            <div className="roll-orb__panel" hidden={!open}>
                <p className="roll-orb__label">{label}</p>
                <p className="roll-orb__total"></p>
                <p className="roll-orb__detail"></p>
            </div>
        </div>
    );
}

export default RollOrb;
