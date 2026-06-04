const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const upload = require('../config/multer');

router.post('/', upload.single('evidencia'), supportController.createReport);
router.get('/my', supportController.listUserReports);

module.exports = router;
