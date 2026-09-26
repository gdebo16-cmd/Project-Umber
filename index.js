import express from "express";
import 'dotenv/config';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import homeRoutes from './routes/home.js';
import path from "path"; //import of user paths
import { fileURLToPath } from "url"; //import of form reader
import session from "express-session"; //import use of per-session structure
import fs from "fs/promises"; //import function promise structure

const app = express();
const store = new session.MemoryStore();

const __filename = fileURLToPath(import.meta.url);  //import of form reader
const __dirname = path.dirname(__filename); //import of path reader
const publicDir = path.join(__dirname, "Public"); //Creating a path to join


app.use(
	session({               //defines security and rule set of each session
		secret: process.env.SESSION_SECRET,
		cookie: { maxAge: 300000000, secure: false, sameSite: "lax" },
		resave: false,
		saveUninitialized: false, store,
	})
);

app.set("trust proxy", 1);
app.set('view engine', 'ejs')


app.use(express.json()); //to accept JSON strings
app.use(express.urlencoded({ extended: true }));  //to accept forms
app.use(express.static(publicDir));

app.use('/auth', authRoutes);
app.use('/home', homeRoutes)

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.sendFile("signin.html", { root: publicDir });
});

app.get("/register", (req, res) => {
  res.sendFile("registration.html", { root: publicDir });
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

app.get("/create_char", async (req, res) => {
	if (!req.session.userId) {
		return res.redirect ("/login");
	}

	try {
		const races = await pool.query("SELECT id, name FROM races ORDER BY name");

		let raceOptions = races.rows.map(race => `<option value"${race.id}">${race.name}</option>`).join("");

		if (!raceOptions) {
			raceOptions = `<option value="" disabled selected>No races in database yet</option>`;
		}

		const filePath = path.join(publicDir, "create_char.html");
		let html = await fs.readFile(filePath, "utf8");
		html = html.replaceAll("{{raceOptions}}", raceOptions);
		res.send(html);
	} catch (err) {
		console.error(err);
		res.status(500).send("could not load character creation");
	}
});

app.post("/create_char/step1", (req, res) => {
	if (!req.session.userId) {
		return res.redirect("/login");
	}

	const { name, race_id } = req.body;

	if (!name || !race_id) {
		return res.status(400).send("name and race are required");
	}

	//draft locker 

	req.session.charDraft = {
		name: name.trim(),
		race_id: Number(race_id),
	};

	res.redirect("/create_char/step2");
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`App is running on http://localhost:${process.env.PORT || 3000}`);
});

/* setupPrimary().catch((err) => {
	console.error(err);
	process.exit(1);
}) */