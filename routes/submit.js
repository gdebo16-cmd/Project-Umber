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