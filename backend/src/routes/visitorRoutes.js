const express = require('express');
const router = express.Router();
const {
  createVisitor,
  getAllVisitors,
  getStats,
  getSingleVisitor,
  updateVisitor,
  deleteVisitor,
} = require('../controllers/visitorController');
const { authenticate, authorizeRoles } = require('../middlewares/authMiddleware');

// Every visitor route requires a logged-in user
router.use(authenticate);

// Base route: /api/v1/visitors
router.route('/').post(createVisitor).get(getAllVisitors);

// Must be declared before '/:id' so "stats" is not treated as an id
router.get('/stats', getStats);

router
  .route('/:id')
  .get(getSingleVisitor)
  .patch(updateVisitor)
  .delete(authorizeRoles('employee'), deleteVisitor); // only staff can delete

module.exports = router;
