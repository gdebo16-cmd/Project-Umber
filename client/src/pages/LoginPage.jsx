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
            <header id="topContainer">
                <h1 id="siteTitle">Eldrid Tales</h1>
            </header>

            <main>
                <section className="formContainer">
                    <article className="formTitle">
                        <h2 id="titleText">Welcome to Your Legend</h2>
                    </article>
                    <form onSubmit={submit}>
                        <article className="formSectionContainer userNameContainer">
                            <label id="userNameLabel" className="signinLabel" htmlFor="userName">Enter Username</label>
                            <input className="signinValue" type="text" id="userName" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </article>

                        <article className="formSectionContainer passwordContainer ">
                            <label id="passwordLabel" className="signinLabel" htmlFor="password">Enter Password</label>
                            <input className="signinValue" type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </article>

                        {error && <p>{error}</p>}

                        <article className="formSectionContainer buttonContainer">
                            <button id="loginButton" className="formButton" type="submit">Login</button>
                            <Link to="/register" className="formButton" id="newUserButton">Create New User</Link>
                        </article>
                    </form>
                </section>
            </main>
            <footer>
                <p id="footerText">© 2026 Eldrid Tales. All rights reserved.</p>
            </footer>
        </>
    );
}

export default LoginPage;
