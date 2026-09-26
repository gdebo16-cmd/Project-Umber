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


app.post('/login', (req, res) => {
     const { username, password } = req.body;
     pool.users.findByUsername(username, (err, user) => {
        if (!user)return res.status(403).send("User not Found");
        if (user.password === password) {
            req.session.authenticated = true;
            req.session.user = {
                username,
                password,
            };
            res.redirect("/home");
        } else {
            res.status(403).send("Invalid Credentials")
        }
     });
})