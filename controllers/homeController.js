import pool from "../db.js";


export async function home(req, res) {
    if(!req.session.userId) {
        return res.redirect("/login");
    }

    try {
        const result = await pool.query(
            `SELECT ch.id, ch.name,
                    r.name AS race,
                    c.name AS class,
                    sc.name AS subclass
            FROM characters ch
            LEFT JOIN races r ON ch.race_id = r.id
            LEFT JOIN classes c ON ch.class_id = c.id
            LEFT JOIN sub_classes sc ON ch.subclass_id = sc.id
            WHERE ch.user_id = $1
            ORDER BY ch.created_at DESC`,
            [req.session.userId]
        )
        res.render("home", { username: req.session.username, characters: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).send("could not load home page")
    }
};