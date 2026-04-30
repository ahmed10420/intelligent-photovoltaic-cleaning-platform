const express = require('express');
const router = express.Router();
const {
  createCleaning,
  getCleanings,
  getCleaningsByCentral,
  deleteCleaning,
} = require('../controllers/cleaningController');

router.get('/', getCleanings);
router.get('/central/:centralId', getCleaningsByCentral);
router.post('/', createCleaning);
router.delete('/:id', deleteCleaning);

module.exports = router;