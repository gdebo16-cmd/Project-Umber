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