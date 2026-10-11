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
                <section id="formContainer">
                    <article id="formTitle">
                        <h2 id="titleText">Welcome to Your Legend</h2>
                    </article>
                    <form className="formContainer" onSubmit={submit}>
                        <article className="formSectionContainer tile" id="userNameContainer">
                            <label id="userNameLabel" className="topTile" htmlFor="userName">Enter Username</label>
                            <input className="bottomTile" type="text" id="userName" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </article>

                        <article className="formSectionContainer tile" id="passwordContainer">
                            <label id="passwordLabel" className="topTile" htmlFor="password">Enter Password</label>
                            <input className="bottomTile" type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </article>

                        {error && <p>{error}</p>}

                        <article className="formSectionContainer" id="buttonContainer">
                            <button id="submit" className="formButton" type="submit">Login</button>
                            <Link to="/register" className="formButton" id="newUser">Create New User</Link>
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
