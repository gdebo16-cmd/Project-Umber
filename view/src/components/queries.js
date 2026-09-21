/* import 'dotenv/config'
import pg from 'pg'
const pool = new Pool{
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
} */

import pg from 'pg'
const { Pool } = pg
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'postgres',
  port: 5432,
})

//view user

const getUsers = async (req, res) => {
  try {
    const results = await pool.query('SELECT * FROM users ORDER BY id ASC')
    res.status(200).json(results.rows)
  } catch (error) {
    throw error
  }
}

//view user by ID

const getUserById = async (req, res) => {
  const id = parseInt(req.params.id, 10)

  try {
    const results = await pool.query('SELECT * FROM users WHERE id = $1', [id])
    res.status(200).json(results.rows)
  } catch (error) {
    throw error
  }
}

//create user

const createUser = async(req, res) => {
  const { name, email } = request.body

  try {
    const results = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    )
    res.status(201).send(`User added with ID: ${results.rows[0].id}`)
  } catch (error) {
    throw error
  }
}

//update existing user

const updateUser = async (req, res) => {
  const id = parseInt(req.params.id, 10)
  const { name, email } = req.body

  try {
    await pool.query('UPDATE users SET name = $1, email = $2 WHERE id = $3', 
      [
        name, 
        email,
        id
      ]
    ) 
    res.status(200).send(`User modified with ID: ${id}`)
  } catch (error) {
    throw error
  }
}

//delete user

const deleteUser = async (req, res) => {
  const id = parseInt(req.params.id, 10)

  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id])
    res.status(200).send(`User deleted with ID: ${id}`)
  } catch (error) {
    throw error
  }
}

export {
  getUsers, 
  getUserById, 
  createUser,
  updateUser,
  deleteUser,
}