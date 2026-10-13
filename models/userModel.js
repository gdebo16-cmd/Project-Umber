// User database reads and writes: login lookups, registration, settings, profile and theme.
import pool from '../db.js';

// whole user row (incl. password_hash) for login, or undefined
export async function findUserByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    return result.rows[0];
}

export async function usernameExists(username) {
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    return existing.rows.length > 0;
}

// Returns { id, username, created_at }
export async function createUser(username, hash, name, email) {
    const result = await pool.query(
        `INSERT INTO users (username, password_hash, name, email) VALUES ($1, $2, $3, $4) RETURNING id, username, created_at`,
        [username, hash, name, email]
    );
    return result.rows[0];
}

// { username, email } or undefined
export async function getSettings(userId) {
    const result = await pool.query('SELECT username, email FROM users WHERE id = $1', [userId]);
    return result.rows[0];
}

// hash = null keeps the old password
export async function updateSettings(userId, username, email, hash) {
    if (hash) {
        await pool.query(
            'UPDATE users SET username = $1, email = $2, password_hash = $3 WHERE id = $4',
            [username, email, hash, userId]
        );
    } else {
        await pool.query(
            'UPDATE users SET username = $1, email = $2 WHERE id = $3',
            [username, email, userId]
        );
    }
}

export async function getProfile(userId) {
    const result = await pool.query(
        `SELECT u.name, u.username, u.email, u.created_at, u.site_theme,
                (SELECT COUNT(*)::int FROM characters c WHERE c.user_id = u.id) AS character_count
         FROM users u
         WHERE u.id = $1`,
        [userId]
    );
    return result.rows[0];
}

// null name/theme = keep the old value
export async function updateProfile(userId, name, siteTheme) {
    const result = await pool.query(
        'UPDATE users SET name = COALESCE($1, name), site_theme = COALESCE($2, site_theme) WHERE id = $3 RETURNING name, username, email, created_at, site_theme',
        [name, siteTheme, userId]
    );
    return result.rows[0];
}
