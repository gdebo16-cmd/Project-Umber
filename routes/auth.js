import { Router } from "express";
import bcrypt from 'bcryptjs';
import pool from '../db.js';

const router = Router();

router.post('/register', async(req, res) => {
    const {username, password, name, email} = req.body;

    if (!username || !password) {
        return res.status(400).send("Username and Password Required to sign up.");
    }

    try {
        const existing = await pool.query(
            "SELECT id FROM users WHERE username = $1",
            [username]
        );

        if (existing.rows.length > 0) {
            return res.status(409).send(`${username} is already registered`);
        }

        const hash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (username, password_hash, name, email) VALUES ($1, $2, $3, $4) RETURNING id, username, created_at`,
            [username, hash, name, email || null]
        );   
    
        const user = result.rows[0];
        req.session.userId = user.id;
        req.session.username = user.username;
        res.redirect('/home');

    } catch (err) {
        console.error(err);
        res.status(500).send(Error('Error Encountered'));
    }
});

router.post('/login', async (req,res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send("Username and Password are required");
    }

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        const user = result.rows[0];
        if (!user) {
            return res.status(401).send('Invalid Username and/or Password');
        }
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).send('Invalid Username and/or Password')
        }

        req.session.userId = user.id;
        req.session.username = user.username;
        res.redirect('/home');
        
    } catch (err) {
        console.error(err);
        res.status(500).send(Error('There has been an error'));
    }
});

export default router;