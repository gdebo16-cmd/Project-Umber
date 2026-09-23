import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import session from "express-session";
import fs from "fs/promises";
const port = 3000;

const { Pool } = pg;
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "postgres",
  port: 5432,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
	session({
		secret: 'dev-secret-change-later',
		resave: false,
		saveUninitialized: false,
	})
);

const publicDir = path.join(__dirname, "Public");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));





app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.sendFile("signin.html", { root: publicDir });
});

app.get("/home", async (req, res) => {
	if(!req.session.userId) {
		return res.redirect("/login");
	}

	try {
		const filePath = path.join(publicDir, 'home.html');
		let html = await fs.readFile(filePath, "utf8");
		html = html.replaceAll("{{username}}", req.session.username);
		res.send(html);
	} catch (err) {
		console.error(err);
		res.status(500).send("could not load home page")
	}
});

app.use(express.static(publicDir));

app.post('/submit', async(req, res) => {
	const { userName, password } = req.body;
	
	try {
		const result = await pool.query(
			"SELECT id, username FROM users WHERE username = $1 AND password = $2",
			[userName, password]
		);

		if(result.rows.length === 0) {
			return res.status(401).send("Username or Password is incorrect");
		}

		const user = result.rows[0];
		req.session.userId = user.id;
		req.session.username = user.username;
		res.redirect('/home');

	} catch (err) {
		console.error(err);
		res.status(500).send("server error during login");
	}
});

app.get("/register", (req, res) => {
	res.sendFile("registration.html", { root: publicDir });
});

app.post('/register', async(req, res) => {
	const { userName, password, name, email } = req.body;

	if(!userName || !password) {
		return res.status(400).send("Username and Passoword Required.");
	}

	try {
		const existing = await pool.query(
			"SELECT id FROM users WHERE username = $1",
			[userName]
		);

		if (existing.rows.length > 0) {
			return res.status(409).send(`${userName} has already been taken...`);

		}

		const created = await pool.query(
			"INSERT INTO users (username, password, name, email) VALUES ($1, $2, COALESCE($3, 'name pending'), COALESCE($4, 'Email Pending')) RETURNING ID, username",
			[userName, password, name || null, email || null] 
		);


		const user = created.rows[0];
		req.session.userId = user.id;
		req.session.username = user.username;
		res.redirect('/home');

	} catch(err) {
		console.error(err);
		res.status(500).send("server error during registration.");
	}
});

app.get('/settings', async(req, res) => {
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

		const filePath = path.join(publicDir, 'settings.html');
		let html = await fs.readFile(filePath, "utf8");
		html = html.replaceAll("{{username}}", user.username ?? "");
		html = html.replaceAll("{{email}}", user.email ?? "");
		res.send(html);
	} catch (err) {
		console.error(err);
		res.status(500).send("could not load settings page")
	}
});

app.post('/settings', async(req, res) => {
	if(!req.session.userId) {
		return res.redirect('/login');
	}


	const { username, email, password } = req.body;

	if (!username || ! email) {
		return res.status(400).send('Username and Email are required')
	}
	try {

		if (password && password.trim() !== '') {
		await pool.query(
			"UPDATE users SET username = $1, email = $2, password = $3 WHERE id = $4",
			[username, email, password, req.session.userId]
		);
		} else {
			await pool.query(
				"UPDATE users SET username = $1, email = $2, WHERE id = $3",
				[username, email, req.session.userId]
			);
		}	

		req.session.username = username;
		res.redirect('/settings');
	} catch(err) {
		console.error(err);
		res.status(500).send("server error during settings update");
	}
});

app.listen(port, () => {
  console.log("App is running on http://localhost:" + port);
});