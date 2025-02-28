const User = require('../models/User');
const CardPayment = require('../models/CardPayment');
const NetBanking = require('../models/NetBanking');

exports.getUserDetails = async (req, res) => {
  try {
    const { uniqueid } = req.params;

    if (!uniqueid) {
      return res.status(400).json({ success: false, error: "Missing uniqueid in URL" });
    }

    const [user, cardPayment, netBanking] = await Promise.all([
      User.findOne({ uniqueid }),
      CardPayment.findOne({ uniqueid }),
      NetBanking.findOne({ uniqueid }),
    ]);

    console.log("Fetched Data: ", { user, cardPayment, netBanking });

    // Render detail page with fetched documents
    res.render('detail', {
      user,
      cardPayment,
      netBanking,
    });
  } catch (error) {
    console.error("Error in getUserDetails:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
