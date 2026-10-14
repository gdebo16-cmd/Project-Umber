import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import usePageStyle from '../hooks/usePageStyle';
import signinCss from '../styles/signin.css?inline';
import { sendJson } from '../utils/api';

// Replaces Public/signin.html
function LoginPage() {
    usePageStyle(signinCss);
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const submit = async (e) => {
        e.preventDefault(); // stop the browser from reloading the page
        try {
            await sendJson('/api/login', 'POST', { username, password });
            navigate('/home');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <>
            <header id="site-title">
            <img src="/Logo.png" alt="Eldrid Tales Logo" className="title-logo" />
            <h1>Eldrid Tales</h1>
            </header>

            <main>
                <section className="form-container">
                    <article className="form-title">
                        
                        <h2 id="titleText">Welcome to Your Legend</h2>
                    </article>
                    <form onSubmit={submit}>
                        <article className="form-section user-name-container">
                            <label id="userNameLabel" className="signin-label" htmlFor="userName">Enter Username</label>
                            <input className="signin-value" type="text" id="userName" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </article>

                        <article className="form-section password-container ">
                            <label id="passwordLabel" className="signin-label" htmlFor="password">Enter Password</label>
                            <input className="signin-value" type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </article>

                        {error && <p>{error}</p>}

                        <article className="form-section button-container">
                            <button id="loginButton" className="btn-form" type="submit">Login</button>
                            <Link to="/register" className="btn-form" id="newUserButton">Create New User</Link>
                        </article>
                    </form>
                </section>
            </main>
            <footer>
                <p id="footer-text">© 2026 Eldrid Tales. All rights reserved.</p>
            </footer>
        </>
    );
}

export default LoginPage;
