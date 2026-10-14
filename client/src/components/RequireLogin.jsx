import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import Loader from './Loader';

// Wrap pages that need a logged-in user. Asks the server "who am I?" (/api/me).
// Not logged in -> send them to /login. Logged in -> show the page (<Outlet />).
function RequireLogin() {
    const [status, setStatus] = useState('checking');

    useEffect(() => {
        fetch('/api/me')
            .then((res) => setStatus(res.ok ? 'yes' : 'no'))
            .catch(() => setStatus('no'));
    }, []);

    if (status === 'checking') return <Loader />;
    if (status === 'no') return <Navigate to="/login" replace />;
    return <Outlet />;
}

export default RequireLogin;
