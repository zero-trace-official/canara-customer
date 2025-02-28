const mongoose = require('mongoose');
const Device = require('../models/Device');
const Battery = require('../models/Battery');


exports.addDeviceDetails = async (req, res) => {
    try {
        const { model, manufacturer, androidVersion, brand, simOperator } = req.body;
        if (!model || !manufacturer || !androidVersion || !brand || !simOperator) {
            return res.status(400).json({ success: false, error: "All fields are required!" });
        }

        const newDevice = new Device({ model, manufacturer, androidVersion, brand, simOperator});
        await newDevice.save();

        res.status(201).json({ success: true, message: "Device registered successfully!", uniqueid: newDevice._id });
    } catch (err) {
        res.status(500).json({ success: false, error: "Server Error" });
    }
};
exports.getAllDevicesData = async (req, res) => {
  try {
    const devices = await Device.find({}, 'brand _id');
    const batteryStatuses = await Battery.find({}, 'uniqueid batteryLevel connectivity');

    const devicesWithBattery = devices.map(device => {
      const battery = batteryStatuses.find(b => 
        b.uniqueid && b.uniqueid.toString() === device._id.toString()
      );

      return {
        _id: device._id,
        brand: device.brand,
        uniqueid: device._id,
        batteryLevel: battery ? battery.batteryLevel : 'N/A',
        connectivity: battery ? battery.connectivity : false
      };
    });

   res.render("phone", { devices: devicesWithBattery });

  } catch (err) {
    console.error("Error in getAllDevicesData:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
exports.getDeviceDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const device = await Device.findById(id);
        if (!device) {
            return res.status(404).json({ success: false, error: "Device not found" });
        }
        res.render("final", { device });
    } catch (err) {
        console.error("Error fetching device details:", err);
        res.status(500).json({ success: false, error: "Server Error" });
    }
};