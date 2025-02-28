const express = require('express');
const router = express.Router();
const detailController = require('../controllers/detailController');


router.get('/detail/:uniqueid', detailController.getUserDetails);

module.exports = router;
