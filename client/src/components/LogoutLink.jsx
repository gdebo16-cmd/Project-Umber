import { useNavigate } from 'react-router';

// "Log Out" in the Settings dropdown: ends the session on the server, then goes to /login.
function LogoutLink() {
    const navigate = useNavigate();

    const logout = async (e) => {
        e.preventDefault();
        await fetch('/api/logout', { method: 'POST' });
        navigate('/login');
    };

    return (
        <a id="logout" className="btn-drop-settings" href="/login" onClick={logout}>Log Out</a>
    );
}

export default LogoutLink;
