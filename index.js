import express from "express";
import 'dotenv/config';
import authRoutes from './routes/auth.js';
import homeRoutes from './routes/home.js';
import settingsRoutes from './routes/settings.js';
import char_createRoutes from './routes/char_create.js';
import charRoutes from './routes/char.js';
import session from "express-session"; //import use of per-session structure
import path from "path";
import { fileURLToPath } from "url";


const app = express();
const store = new session.MemoryStore();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "Public");

app.use(
	session({               //defines security and rule set of each session
		secret: process.env.SESSION_SECRET,
		cookie: { maxAge: 300000000, secure: false, sameSite: "lax" },
		resave: false,
		saveUninitialized: false, store,
	})
);

app.set("trust proxy", 1);
app.set('view engine', 'ejs');
app.set('views', './views');


app.use(express.json()); //to accept JSON strings
app.use(express.urlencoded({ extended: true }));  //to accept forms
app.use(express.static(publicDir));

app.use('/auth', authRoutes);
app.use('/home', homeRoutes);
app.use('/create_char', char_createRoutes);
app.use('/settings', settingsRoutes);
app.use('/characters', charRoutes);
app.use('/charEdit', charRoutes);


app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get("/", (req, res) => res.redirect("/login"));
app.get("/login", (req, res) => res.sendFile("signin.html", { root: publicDir }));
app.get("/register", (req, res) => res.sendFile("registration.html", { root: publicDir }));

app.listen(process.env.PORT || 3000, () => {
  console.log(`App is running on http://localhost:${process.env.PORT || 3000}`);
});

