import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

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
const port = 3000;
const publicDir = path.join(__dirname, "Public");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.sendFile("signin.html", { root: publicDir });
});

app.get("/home", (req, res) => {
	res.sendFile("home.html", { root: publicDir });
})

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

		await pool.query(
			"INSERT INTO users (username, password, name, email) VALUES ($1, $2, COALESCE($3, 'name pending'), COALESCE($4, 'Email Pending'))",
			[userName, password, name || null, email || null] 
		);

		res.redirect('/home');
		
	} catch(err) {
		console.error(err);
		res.status(500).send("server error during registration.");
	}
});

app.listen(port, () => {
  console.log("App is running on http://localhost:" + port);
});