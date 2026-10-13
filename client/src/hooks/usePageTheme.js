import { useEffect } from 'react';
import { useLocation } from 'react-router';

// Safari colors the status bar with the theme-color tag. Our title color is see-through,
// so drop its transparency and use the solid version of the same color.
function syncStatusBarColor() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--bg-color-1').trim();
    const nums = raw.match(/[\d.]+/g);
    if (!nums || nums.length < 3) return;
    const solid = `rgb(${nums[0]}, ${nums[1]}, ${nums[2]})`;
    let tag = document.querySelector('meta[name="theme-color"]');
    if (!tag) {
        tag = document.createElement('meta');
        tag.name = 'theme-color';
        document.head.appendChild(tag);
    }
    tag.content = solid;
}

function usePageTheme() {
    const { pathname} = useLocation();
    useEffect(() => {
        // every page, character sheet included, uses the theme picked on the profile page
        const theme = localStorage.getItem('siteTheme') || 'default';
        document.documentElement.setAttribute('data-theme', theme);
        syncStatusBarColor();
    }, [pathname]);

    useEffect(() => {
        // also follow live theme changes from the theme picker
        const watcher = new MutationObserver(syncStatusBarColor);
        watcher.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => watcher.disconnect();
    }, []);
}

export default usePageTheme;