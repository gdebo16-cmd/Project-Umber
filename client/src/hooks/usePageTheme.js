import { useEffect } from 'react';
import { useLocation } from 'react-router';

function usePageTheme() {
    const { pathname} = useLocation();
    useEffect(() => {
        // every page, character sheet included, uses the theme picked on the profile page
        const theme = localStorage.getItem('siteTheme') || 'default';
        document.documentElement.setAttribute('data-theme', theme);
    }, [pathname]);
}

export default usePageTheme;