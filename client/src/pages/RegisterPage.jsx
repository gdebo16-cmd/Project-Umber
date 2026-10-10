import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import usePageStyle from '../hooks/usePageStyle';
import signinCss from '../styles/signin.css?inline';
import { sendJson } from '../utils/api';

// Replaces Public/registration.html
function RegisterPage() {
    usePageStyle(signinCss);
    const navigate = useNavigate();
    // one state object for the whole form
    const [form, setForm] = useState({ username: '', password: '', email: '', name: '' });
    const [error, setError] = useState('');

    const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        try {
            await sendJson('/api/register', 'POST', form);
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
                        <h2 id="titleText">Create Your Legend</h2>
                    </article>
                    <form className="formContainer" onSubmit={submit}>
                        <article className="formSectionContainer tile" id="userNameContainer">
                            <label id="userNameLabel" className="topTile" htmlFor="userName">Username</label>
                            <input className="bottomTile" type="text" id="userName" name="username" value={form.username} onChange={update} required />
                        </article>

                        <article className="formSectionContainer tile" id="passwordContainer">
                            <label id="passwordLabel" className="topTile" htmlFor="password">Password</label>
                            <input className="bottomTile" type="password" id="password" name="password" value={form.password} onChange={update} required />
                        </article>

                        <article className="formSectionContainer tile" id="emailContainer">
                            <label id="emailLabel" className="topTile" htmlFor="email">Email</label>
                            <input className="bottomTile" type="email" id="email" name="email" value={form.email} onChange={update} />
                        </article>

                        <article className="formSectionContainer tile" id="nameContainer">
                            <label id="nameLabel" className="topTile" htmlFor="name">Display Name</label>
                            <input className="bottomTile" type="text" id="name" name="name" value={form.name} onChange={update} />
                        </article>

                        {error && <p>{error}</p>}

                        <article className="formSectionContainer tile" id="regButtonContainer">
                            <button className="formButton" id="submit" type="submit">Create Account</button>
                        </article>
                    </form>
                </section>
            </main>
            <footer>
                <p id="footerText">© 2026 Eldrid Tales. All rights reserved.</p>
                <Link id="loginLink" to="/login">Back to login</Link>
            </footer>
        </>
    );
}

export default RegisterPage;
