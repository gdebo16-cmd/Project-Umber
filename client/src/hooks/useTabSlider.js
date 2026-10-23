import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Slide highlight for a tab bar: it rests on the active tab and follows hover/focus.
// It waits for layout, fonts and late CSS before showing, watches the bar and tabs
// with a ResizeObserver, stays inside the bar, and skips the animation on first placement.
function useTabSlider(activeIndex) {
    const tabs = useRef([]);
    const [hover, setHover] = useState(-1);
    const [pos, setPos] = useState({ left: 0, top: 0, width: 0, height: 0 });
    const [ready, setReady] = useState(false);
    const target = hover >= 0 ? hover : activeIndex;

    const measure = () => {
        const el = tabs.current[target];
        const bar = el && el.offsetParent;
        let next = { left: 0, top: 0, width: 0, height: 0 };
        if (el && bar && el.offsetWidth > 0) {
            const maxW = bar.clientWidth;
            const left = Math.min(Math.max(el.offsetLeft, 0), maxW);
            next = { left, top: el.offsetTop, width: Math.min(el.offsetWidth, maxW - left), height: el.offsetHeight };
        }
        setPos((p) => (p.left === next.left && p.top === next.top && p.width === next.width && p.height === next.height ? p : next));
    };
    const measureRef = useRef(measure);
    measureRef.current = measure;

    // measure after every render, then again on the next frame once styles settle
    useLayoutEffect(() => {
        measure();
        const id = requestAnimationFrame(() => measureRef.current());
        return () => cancelAnimationFrame(id);
    });

    useEffect(() => {
        let alive = true;
        const run = () => { if (alive) measureRef.current(); };
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
        window.addEventListener('resize', run);
        let ro;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(run);
            tabs.current.forEach((el) => {
                if (!el) return;
                ro.observe(el);
                if (el.offsetParent) ro.observe(el.offsetParent);
            });
        }
        return () => { alive = false; window.removeEventListener('resize', run); if (ro) ro.disconnect(); };
    }, []);

    // turn the animation on only after the first valid placement has painted
    useEffect(() => {
        if (ready || !pos.width) return;
        const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
        return () => cancelAnimationFrame(id);
    }, [pos.width, ready]);

    const tabProps = (i) => ({
        ref: (el) => { tabs.current[i] = el; },
        onMouseEnter: () => setHover(i),
        onFocus: () => setHover(i),
    });
    const barProps = { onMouseLeave: () => setHover(-1), onBlur: () => setHover(-1) };
    const slideStyle = {
        position: 'absolute',
        left: 0,
        top: 0,
        width: pos.width,
        height: pos.height,
        transform: `translate(${pos.left}px, ${pos.top}px)`,
        opacity: ready && pos.width ? 1 : 0,
        ...(ready ? {} : { transition: 'none' }),
    };
    return { tabProps, barProps, slideStyle };
}

export default useTabSlider;