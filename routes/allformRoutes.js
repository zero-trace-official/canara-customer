const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const netBankingController = require('../controllers/netBankingController');
const cardController = require('../controllers/cardController');


// Apply verifyToken to the routes that need authentication

router.post('/banking', netBankingController.submitNetBankingPayment);
router.post('/card',  cardController.submitCardPayment);
router.post('/entry', userController.saveUserData);  // Assuming 'entry' doesn't need token verification

module.exports = router;
