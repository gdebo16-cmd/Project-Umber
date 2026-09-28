import pool from '../db.js';
import bcrypt from 'bcryptjs';

export async function settings(req, res) {
    if(!req.session.userId) {
        return res.redirect("/login");
    }

    try {
        const result = await pool.query(
            "SELECT username, email FROM users where id = $1",
            [req.session.userId]
        );

        const user = result.rows[0]
        if (!user) {
            return res.redirect("/login");
        }		

        res.render("settings", { username: user.username ?? "", email: user.email ?? "" });

    } catch (err) {
        console.error(err);
        res.status(500).send("could not load settings page")
    }
};


export async function settingsUpdate(req, res) {
    if(!req.session.userId) {
        return res.redirect('/login');
    };

    const { username, email, password } = req.body;

    
    try {
        if (password && password.trim() !== '') {
            const hash = await bcrypt.hash(password, 12);
        await pool.query(
            "UPDATE users SET username = $1, email = $2, password_hash = $3 WHERE id = $4",
            [username, email, hash, req.session.userId]
        );

        } else {
            await pool.query(
                "UPDATE users SET username = $1, email = $2 WHERE id = $3",
                [username, email, req.session.userId]
            );
        }	

        req.session.username = username;
        res.redirect('/settings');
    
    } catch(err) {
        console.error(err);
        res.status(500).send("server error during settings update");
    }
};