import express from "express";
import 'dotenv/config';
import connectPgSimple from 'connect-pg-simple';
import pool from './db.js';
import apiRoutes from './routes/api.js';
import session from "express-session"; //import use of per-session structure
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";


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

const sessionMiddleware = session({               //defines security and rule set of each session
	secret: process.env.SESSION_SECRET,
	cookie: { maxAge: 300000000,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax"
	},
	resave: false,
	saveUninitialized: false, store,
});

app.use(sessionMiddleware);

app.use(express.json()); //to accept JSON strings
app.use(express.urlencoded({ extended: true }));  //to accept forms
app.use(express.static(publicDir)); // images (/utils, /classes, /races, /subclasses) for the React client

app.use('/api', apiRoutes);


app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use(express.static(clientDist));

app.get(/^(?!\/api).*/, (req, res) => {
	res.sendFile('index.html', { root: clientDist });
});

const server = createServer(app);
const io = new Server(server);

io.engine.use(sessionMiddleware);

io.on('connection', (socket) => {
	const userId = socket.request.session?.userId;
	if (!userId) return socket.disconnect(true);
	console.log(`User ${userId} connected`);
	socket.on('join-sheet', async (characterId) => {
		const { rows } = await pool.query(
			`SELECT cm.campaign_id, ch.name
			FROM campaign_members cm
			JOIN characters ch ON ch.id = cm.character_id
			WHERE cm.character_id = $1 AND ch.user_id = $2`,
			[Number(characterId), userId]
		);
		socket.data.characterId = Number(characterId);
		socket.data.characterName = rows[0]?.name;
		rows.forEach((r) => socket.join(`campaign:${r.campaign_id}`));
		console.log(`character ${characterId} joined`, rows.map((r) => r.campaign_id));
	});
	socket.on('roll', (label) => {
		if (!socket.data.characterId || typeof label !== 'string') return;
		const roll = {
			characterId: socket.data.characterId,
			name: socket.data.characterName,
			label: label.slice(0, 300),
			at: Date.now(),
		};
		for (const room of socket.rooms) {
			if (room.startsWith('campaign:')) socket.to(room).emit('roll', roll);
		}
	});
});


server.listen(process.env.PORT || 3000, () => {
	console.log(`App is running on http://localhost:${process.env.PORT || 3000}`);
});


