const express = require('express');
const router = express.Router();
const {
  createAnalysis,
  getAnalyses,
  getAnalysesByCentral,
} = require('../controllers/analysisController');

router.get('/', getAnalyses);
router.get('/central/:centralId', getAnalysesByCentral);
router.post('/', createAnalysis);

module.exports = router;
