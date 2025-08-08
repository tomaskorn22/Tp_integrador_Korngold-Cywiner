import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
//import eventRoutes from './routes/eventRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
//app.use('/api/user', authRoutes);
//app.use('/api/event', eventRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
