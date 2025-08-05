const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const eventLocationRoutes = require('./routes/eventLocationRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/user', authRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/event-location', eventLocationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
