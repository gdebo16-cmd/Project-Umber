import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import Loader from './Loader';

// Wrap pages that need a logged-in user. Asks the server "who am I?" (/api/me).
// Not logged in -> send them to /login. Logged in -> show the page (<Outlet />).
function RequireLogin() {
    const [status, setStatus] = useState('checking');

    useEffect(() => {
        fetch('/api/me')
            .then(async (res) => {
                if (res.ok) {
                    // pull the saved theme and background from the account so they follow you to any device
                    const p = await fetch('/api/profile').then((r) => (r.ok ? r.json() : null)).catch(() => null);
                    if (p?.site_theme) {
                        localStorage.setItem('siteTheme', p.site_theme);
                        document.documentElement.setAttribute('data-theme', p.site_theme);
                    }
                    if (p?.site_background) {
                        localStorage.setItem('siteBackground', p.site_background);
                        document.documentElement.setAttribute('data-background', p.site_background);
                    }
                    if (p?.site_display) {
                        localStorage.setItem('siteDisplay', p.site_display);
                        document.documentElement.setAttribute('data-display', p.site_display);
                    }
                }
                setStatus(res.ok ? 'yes' : 'no');
            })
            .catch(() => setStatus('no'));
    }, []);

    if (status === 'checking') return <Loader />;
    if (status === 'no') return <Navigate to="/login" replace />;
    return <Outlet />;
}

export default RequireLogin;
