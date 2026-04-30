const express = require('express');
const router = express.Router();
const { getCentrals, createCentral, getCentral, updateCentral, deleteCentral, getStats } = require('../controllers/centralController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getStats);
router.route('/').get(getCentrals).post(createCentral);
router.route('/:id').get(getCentral).put(updateCentral).delete(deleteCentral);

module.exports = router;
