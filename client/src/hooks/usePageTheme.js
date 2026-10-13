import { useEffect } from 'react';
import { useLocation } from 'react-router';

function usePageTheme() {
    const { pathname} = useLocation();
    useEffect(() => {
        const onSheet = pathname.startsWith('/characters');
        const theme = onSheet
            ? localStorage.getItem('theme') || 'light'
            : localStorage.getItem('siteTheme') || 'light';
            document.documentElement.setAttribute('data-theme', theme);
    }, [pathname]);
}

export default usePageTheme;