import { useEffect, useState } from 'react';
import usePageStyle from '../hooks/usePageStyle';
import settingsCss from '../styles/settings.css?inline';
import SiteNav from '../components/SiteNav';
import { sendJson } from '../utils/api';

// Replaces views/settings.ejs
function SettingsPage() {
    usePageStyle(settingsCss);
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

    // the browser's confirm popup has to say OK before anything is deleted
    const deleteAccount = async () => {
        const ok = window.confirm('Delete your profile? This permanently removes your account, characters and campaigns. This cannot be undone.');
        if (!ok) return;
        try {
            await sendJson('/api/settings', 'DELETE');
            window.location.href = '/'; // full reload so the app forgets the old login
        } catch (err) {
            setMessage(err.message);
        }
    };

    return (
        <>
            <header id="site-title">
                <img src="/Logo.png" alt="Eldrid Tales Logo" className="title-logo" />
                <h1>Account Settings</h1>
            </header>
            <SiteNav />
            <main>
                <section className='profile-container'>
                    <form onSubmit={submit}>
                        <article className="profile-tile" id="profile-username-container">
                            <label className="profile-label" htmlFor="username">Username</label>
                            <input className="field profile-value" type="text" id="username" name="username" value={form.username} onChange={update} />
                        </article>

                        <article className="form-section profile-tile" id="profile-email-container">
                            <label className="profile-label" htmlFor="email">Email</label>
                            <input className="field profile-value" type="email" id="email" name="email" value={form.email} onChange={update} />
                        </article>

                        <article className="form-section profile-tile" id="profile-password-container">
                            <label className="profile-label" htmlFor="password">Password</label>
                            <input className="field profile-value" type="password" id="password" name="password" value={form.password} onChange={update} />
                        </article>

                        {message && <p>{message}</p>}

                        <article className="form-section profile-tile" id="profile-submit-container">
                            <button className="profile-button" id="submit" type="submit">Update Account</button>
                        </article>
                    </form>

                    <article className="form-section profile-tile" id="profile-delete-container">
                        <button className="profile-button" id="delete-account" type="button" onClick={deleteAccount}>Delete Profile</button>
                    </article>
                </section>
            </main>
            <footer>
                <p className="footer-text" id="footer-text">copyrite Eldrid Tales LLC</p>
            </footer>
        </>
    );
}

export default SettingsPage;
