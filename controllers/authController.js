const pool = require('../models/DB.JS');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Validación de email con regex
function isEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

exports.register = async (req, res) => {
  const { first_name, last_name, username, password } = req.body;

  if (!first_name || first_name.length < 3 || !last_name || last_name.length < 3) {
    return res.status(400).json({ success: false, message: 'Nombre inválido' });
  }

  if (!isEmail(username)) {
    return res.status(400).json({ success: false, message: 'El email es invalido.' });
  }

  if (!password || password.length < 3) {
    return res.status(400).json({ success: false, message: 'Contraseña inválida' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (first_name, last_name, username, password) VALUES ($1, $2, $3, $4)',
      [first_name, last_name, username, hashedPassword]
    );
    return res.status(201).json({ success: true, message: 'Usuario registrado correctamente' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!isEmail(username)) {
    return res.status(400).json({ success: false, message: 'El email es invalido.', token: '' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario o clave inválida.', token: '' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Usuario o clave inválida.', token: '' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    return res.status(200).json({ success: true, message: '', token });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno', token: '' });
  }
};
