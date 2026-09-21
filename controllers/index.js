import express from 'express'
import * as db from '../node-api-postgres/queries.js'
const app = express()
const port = 3000

app.use(express.json());
app.use(
	express.urlencoded({
		extended: true,
	})
)

app.get('/', (req, res) => {
	res.json({ info: 'Node.js, Express, and Postgres API' })
})

app.get('/users', db.getUsers)
app.get('/users/:id', db.getUserById)
app.post('/users', db.createUser)
app.put('/users/:id', db.updateUser)
app.delete('/users/:id', db.deleteUser)

app.listen(port, () => {
	console.log(`App is running on port ${port}`);
});