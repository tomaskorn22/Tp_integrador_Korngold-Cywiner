// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

exports.authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No autorizado, falta token' });
  }

  const token = authHeader.split(' ')[1]; // "Bearer token"

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });

    req.user = user; // info del usuario para usar en controladores
    next();
  });
};
