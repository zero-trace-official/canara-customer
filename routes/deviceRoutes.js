const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

router.get('/dashboard', deviceController.getAllDevicesData);

router.post('/admin/device-details',  deviceController.addDeviceDetails);

router.get('/admin/phone/:id', deviceController.getDeviceDetails);

module.exports = router;
