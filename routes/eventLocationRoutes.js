import express from 'express';
import * as eventLocationController from '../controllers/eventLocationController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateJWT, eventLocationController.getEventLocations);
router.get('/:id', authenticateJWT, eventLocationController.getEventLocationById);
router.post('/', authenticateJWT, eventLocationController.createEventLocation);
router.put('/:id', authenticateJWT, eventLocationController.updateEventLocation);
router.delete('/:id', authenticateJWT, eventLocationController.deleteEventLocation);

export default router;