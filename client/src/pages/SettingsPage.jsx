import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import usePageStyle from '../usePageStyle';
import homeCss from '../home.css?inline';
import SiteNav from '../SiteNav';
import { sendJson } from '../api';

// Replaces views/settings.ejs
function SettingsPage() {
    usePageStyle(homeCss);
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [welcomeName, setWelcomeName] = useState('');
    const [message, setMessage] = useState('');

    // load the current username and email once
    useEffect(() => {
        fetch('/api/settings')
            .then((res) => res.json())
            .then((data) => {
                setForm({ username: data.username, email: data.email, password: '' });
                setWelcomeName(data.username);
            });
    }, []);

    const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        try {
            const data = await sendJson('/api/settings', 'PUT', form);
            setWelcomeName(data.username);
            setForm({ ...form, password: '' }); // clear the password box, like the page reload did
            setMessage('Account updated');
        } catch (err) {
            setMessage(err.message);
        }
    };

    return (
        <>
            <header id="topContainer">
                <h1 id="siteTitle">Welcome {welcomeName}, To Eldridia</h1>
                <SiteNav />
            </header>

            <main>
                <section id="formContainer">
                    <article id="formTitle">
                        <h2 id="titleText">Settings</h2>
                        <h3 id="subTitleText">Account Information</h3>
                    </article>
                    <form className="formContainer" onSubmit={submit}>
                        <article id="userNameContainer" className="formSectionContainer tile">
                            <label className="topTile" htmlFor="username">Username</label>
                            <input className="bottomTile" type="text" id="username" name="username" value={form.username} onChange={update} />
                        </article>

                        <article id="emailContainer" className="formSectionContainer tile">
                            <label className="topTile" htmlFor="email">Email</label>
                            <input className="bottomTile" type="email" id="email" name="email" value={form.email} onChange={update} />
                        </article>

                        <article id="passwordContainer" className="formSectionContainer tile">
                            <label className="topTile" htmlFor="password">Password</label>
                            <input className="bottomTile" type="password" id="password" name="password" value={form.password} onChange={update} />
                        </article>

                        {message && <p>{message}</p>}

                        <article id="buttonContainer" className="formSectionContainer">
                            <button className="formButton" id="submit" type="submit">Update Account</button>
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
