const express = require('express');
const router = express.Router();
const { getMe, getEmployees } = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');

// Base route: /api/v1/users
router.use(authenticate);
router.get('/me', getMe);
router.get('/employees', getEmployees);

module.exports = router;
