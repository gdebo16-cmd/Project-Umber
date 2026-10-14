// Login, register, logout, "who am I", home page list, and account settings as JSON for React. Queries live in models/.
import bcrypt from "bcryptjs";
import * as Users from '../models/userModel.js';
import { listCharactersForUser } from '../models/characterModel.js';

// GET /api/me  -> { id, username } or 401
export function me(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    res.json({ id: req.session.userId, username: req.session.username });
}

// POST /api/login   body: { username, password }
export async function login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and Password are required' });
    }

    const user = await Users.findUserByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid Username and/or Password' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ id: user.id, username: user.username });
}

// POST /api/register   body: { username, password, name, email }
export async function register(req, res) {
    const { username, password, name, email } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and Password Required to sign up.' });
    }

    if (await Users.usernameExists(username)) {
        return res.status(409).json({ error: `${username} is already registered` });
    }

    const hash = await bcrypt.hash(password, 12);
    const user = await Users.createUser(username, hash, name, email || null);
    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ id: user.id, username: user.username });
}

// POST /api/logout
export function logout(req, res) {
    req.session.destroy(() => res.json({ ok: true }));
}

// GET /api/home  -> { username, characters, draft }
export async function home(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });

    const characters = await listCharactersForUser(req.session.userId);
    res.json({ username: req.session.username, characters, draft: req.session.charDraft || null });
}

// GET /api/settings  -> { username, email }
export async function getSettings(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });

    const user = await Users.getSettings(req.session.userId);
    if (!user) return res.status(401).json({ error: 'Not logged in' });
    res.json({ username: user.username ?? '', email: user.email ?? '' });
}

// PUT /api/settings   body: { username, email, password }  (blank password = keep the old one)
export async function updateSettings(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const { username, email, password } = req.body;

    const hash = password && password.trim() !== '' ? await bcrypt.hash(password, 12) : null;
    await Users.updateSettings(req.session.userId, username, email, hash);

    req.session.username = username;
    res.json({ username, email });
}

// GET /api/profile  -> { name, username, email, created_at, site_theme, character_count }
export async function getProfile(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    try {
        const user = await Users.getProfile(req.session.userId);
        if (!user) return res.status(401).json({ error: 'Not logged in' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// PUT /api/profile   body: { name, site_theme, site_background, site_display }
export async function updateProfile(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const { name, site_theme, site_background, site_display } = req.body;
    try {
        res.json(await Users.updateProfile(req.session.userId, name?.trim() || null, site_theme || null, site_background || null, site_display || null));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
