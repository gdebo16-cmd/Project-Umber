import { Router } from 'express';
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "Public");

const router = Router();

router.get("/", async (req, res) => {
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

export default router;