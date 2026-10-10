// Login, register, logout, "who am I", home page list, and account settings — as JSON for React.
import bcrypt from "bcryptjs";
import pool from "../db.js";

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

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
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

    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
        return res.status(409).json({ error: `${username} is already registered` });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
        `INSERT INTO users (username, password_hash, name, email) VALUES ($1, $2, $3, $4) RETURNING id, username, created_at`,
        [username, hash, name, email || null]
    );

    const user = result.rows[0];
    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ id: user.id, username: user.username });
}

// POST /api/logout
export function logout(req, res) {
    req.session.destroy(() => res.json({ ok: true }));
}

// GET /api/home  -> { username, characters }
export async function home(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });

    const result = await pool.query(
        `SELECT ch.id, ch.name,
                r.name AS race,
                c.name AS class,
                sc.name AS subclass
        FROM characters ch
        LEFT JOIN races r ON ch.race_id = r.id
        LEFT JOIN classes c ON ch.class_id = c.id
        LEFT JOIN sub_classes sc ON ch.subclass_id = sc.id
        WHERE ch.user_id = $1
        ORDER BY ch.created_at DESC`,
        [req.session.userId]
    );
    res.json({ username: req.session.username, characters: result.rows });
}

// GET /api/settings  -> { username, email }
export async function getSettings(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });

    const result = await pool.query('SELECT username, email FROM users WHERE id = $1', [req.session.userId]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Not logged in' });
    res.json({ username: user.username ?? '', email: user.email ?? '' });
}

// PUT /api/settings   body: { username, email, password }  (blank password = keep the old one)
export async function updateSettings(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const { username, email, password } = req.body;

    if (password && password.trim() !== '') {
        const hash = await bcrypt.hash(password, 12);
        await pool.query(
            'UPDATE users SET username = $1, email = $2, password_hash = $3 WHERE id = $4',
            [username, email, hash, req.session.userId]
        );
    } else {
        await pool.query(
            'UPDATE users SET username = $1, email = $2 WHERE id = $3',
            [username, email, req.session.userId]
        );
    }

    req.session.username = username;
    res.json({ username, email });
}
