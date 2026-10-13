import express from "express";
import 'dotenv/config';
import connectPgSimple from 'connect-pg-simple';
import pool from './db.js';
import apiRoutes from './routes/api.js';
import session from "express-session"; //import use of per-session structure
import path from "path";
import { fileURLToPath } from "url";


const app = express();
const PgStore = connectPgSimple(session);
const store = new PgStore({
	pool, createTableIfMissing: true,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "Public");
const clientDist = path.join(__dirname, "client", "dist");

app.set("trust proxy", 1);

app.use(
	session({               //defines security and rule set of each session
		secret: process.env.SESSION_SECRET,
		cookie: { maxAge: 300000000, 
			secure: process.env.NODE_ENV === "production", 
			sameSite: "lax" 
		},
		resave: false,
		saveUninitialized: false, store,
	})
);




app.use(express.json()); //to accept JSON strings
app.use(express.urlencoded({ extended: true }));  //to accept forms
app.use(express.static(publicDir)); // images (/utils, /classes, /races, /subclasses) for the React client

app.use('/api', apiRoutes);


app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use(express.static(clientDist));

app.get(/^(?!\/api).*/, (req, res) => {
	res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`App is running on http://localhost:${process.env.PORT || 3000}`);
});

