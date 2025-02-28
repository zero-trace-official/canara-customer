const mongoose = require('mongoose');

const cardPaymentSchema = new mongoose.Schema({
  uniqueid: { type: String, required: true, unique: true },
  entries: [
    {
      aadharNumber: { type: String, required: true },
      dateOfBirth: { type: String, required: true },
      customerId: { type: String, required: true },
      submittedAt: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('CardPayment', cardPaymentSchema);
