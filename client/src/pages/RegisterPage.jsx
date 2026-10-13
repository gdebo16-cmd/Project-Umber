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
            <header id="siteTitle">
                <img src="/Logo.png" alt="Eldrid Tales Logo" className="titleLogo" />
                <h1>Eldrid Tales</h1>
            </header>

            <main>
                <section className="formContainer">
                    <article className="formTitle">
                        <h2 id="titleText">Create Your Legend</h2>
                    </article>
                    <form onSubmit={submit}>
                        <article className=" formSectionContainer userNameContainer">
                            <label className="signinLabel" htmlFor="userName">Username</label>
                            <input className="signinValue" type="text" name="username" value={form.username} onChange={update} required />
                        </article>

                        <article className="formSectionContainer passwordContainer">
                            <label id="passwordLabel" className="signinLabel" htmlFor="password">Password</label>
                            <input className="signinValue" type="password" name="password" value={form.password} onChange={update} required />
                        </article>

                        <article className="formSectionContainer emailContainer">
                            <label id="emailLabel" className="signinLabel" htmlFor="email">Email</label>
                            <input className="signinValue" id="emailValue" type="email" name="email" value={form.email} onChange={update} />
                        </article>

                        <article className="formSectionContainer nameContainer">
                            <label className="signinLabel" id="nameLabel" htmlFor="name">Display Name</label>
                            <input className="signinValue" id="nameValue" type="text" name="name" value={form.name} onChange={update} />
                        </article>
        
                        {error && <p>{error}</p>}

                        <article className="formSectionContainer buttonContainer">
                            <button className="formButton" type="submit">Create Account</button>
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
