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
            <header id="site-title">
                <img src="/Logo.png" alt="Eldrid Tales Logo" className="title-logo" />
                <h1>Eldrid Tales</h1>
            </header>

            <main>
                <section className="form-container">
                    <article className="form-title">
                        <h2 id="titleText">Create Your Legend</h2>
                    </article>
                    <form onSubmit={submit}>
                        <article className=" form-section user-name-container">
                            <label className="signin-label" htmlFor="userName">Username</label>
                            <input className="signin-value" type="text" name="username" value={form.username} onChange={update} required />
                        </article>

                        <article className="form-section password-container">
                            <label id="passwordLabel" className="signin-label" htmlFor="password">Password</label>
                            <input className="signin-value" type="password" name="password" value={form.password} onChange={update} required />
                        </article>

                        <article className="form-section email-container">
                            <label id="emailLabel" className="signin-label" htmlFor="email">Email</label>
                            <input className="signin-value" id="emailValue" type="email" name="email" value={form.email} onChange={update} />
                        </article>

                        <article className="form-section name-container">
                            <label className="signin-label" id="nameLabel" htmlFor="name">Display Name</label>
                            <input className="signin-value" id="nameValue" type="text" name="name" value={form.name} onChange={update} />
                        </article>
        
                        {error && <p>{error}</p>}

                        <article className="form-section button-container">
                            <button className="btn-form" type="submit">Create Account</button>
                        </article>
                    </form>
                </section>
            </main>
            <footer>
                <p id="footer-text">© 2026 Eldrid Tales. All rights reserved.</p>
                <Link id="login-link" to="/login">Back to login</Link>
            </footer>
        </>
    );
}

export default RegisterPage;
