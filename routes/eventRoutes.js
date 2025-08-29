import express from 'express';
import * as eventController from '../controllers/eventController.js';
import * as enrollmentController from '../controllers/enrollmentController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);
router.post('/', authenticateJWT, eventController.createEvent);
router.put('/', authenticateJWT, eventController.updateEvent);
router.delete('/:id', authenticateJWT, eventController.deleteEvent);

// Enrollment routes
router.post('/:id/enrollment', authenticateJWT, enrollmentController.enrollUser);
router.delete('/:id/enrollment', authenticateJWT, enrollmentController.unenrollUser);

export default router;
