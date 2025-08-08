import express from 'express';
import eventController from '../controllers/eventController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);
router.post('/', authenticateJWT, eventController.createEvent);
router.put('/:id', authenticateJWT, eventController.updateEvent);
router.delete('/:id', authenticateJWT, eventController.deleteEvent);

export default router;
