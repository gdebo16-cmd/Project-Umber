import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import usePageStyle from '../hooks/usePageStyle';
import homeCss from '../styles/home.css?inline';
import SiteNav from '../components/SiteNav';
import { sendJson } from '../utils/api';

// Replaces views/settings.ejs
function SettingsPage() {
    usePageStyle(homeCss);
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [message, setMessage] = useState('');

    // load the current username and email once
    useEffect(() => {
        fetch('/api/settings')
            .then((res) => res.json())
            .then((data) => {
                setForm({ username: data.username, email: data.email, password: '' });
            });
    }, []);

    const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        try {
            await sendJson('/api/settings', 'PUT', form);
            setForm({ ...form, password: '' }); // clear the password box, like the page reload did
            setMessage('Account updated');
        } catch (err) {
            setMessage(err.message);
        }
    };

    return (
        <>
            <header id="siteTitle">
                <img src="/Logo.png" alt="Eldrid Tales Logo" className="titleLogo" />
                <h1>Account Settings</h1>
            </header>
            <SiteNav />
            <main>
                <section>
                    <form onSubmit={submit}>
                        <article className="formSectionContainer profile-tile" id="profile-username-container">
                            <label className="profile-label" htmlFor="username">Username</label>
                            <input className="profile-value" type="text" id="username" name="username" value={form.username} onChange={update} />
                        </article>

                        <article className="formSectionContainer profile-tile" id="profile-email-container">
                            <label className="profile-label" htmlFor="email">Email</label>
                            <input className="profile-value" type="email" id="email" name="email" value={form.email} onChange={update} />
                        </article>

                        <article className="formSectionContainer profile-tile" id="profile-password-container">
                            <label className="profile-label" htmlFor="password">Password</label>
                            <input className="profile-value" type="password" id="password" name="password" value={form.password} onChange={update} />
                        </article>

                        {message && <p>{message}</p>}

                        <article className="formSectionContainer profile-tile" id="profile-submit-container">
                            <button className="profile-button" id="submit" type="submit">Update Account</button>
                        </article>
                    </form>
                </section>
            </main>
            <footer>
                <Link id="homeLink" to="/home">Back to home</Link>
                <p id="footerText">copyrite Eldrid Tales LLC</p>
            </footer>
        </>
    );
}

export default SettingsPage;
