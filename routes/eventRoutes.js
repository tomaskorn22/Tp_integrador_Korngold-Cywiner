const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateJWT } = require('../middleware/authMiddleware');

router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);
router.post('/', authenticateJWT, eventController.createEvent);
router.put('/:id', authenticateJWT, eventController.updateEvent);
router.delete('/:id', authenticateJWT, eventController.deleteEvent);

module.exports = router;
