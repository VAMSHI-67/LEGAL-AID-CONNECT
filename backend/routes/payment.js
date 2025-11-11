const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Tiered access model (stub)
router.get('/tiers', (req, res) => {
  res.json({
    success: true,
    tiers: [
      { name: 'Free', features: ['Basic case submission', 'Limited chat'] },
      { name: 'Premium', features: ['Unlimited chat', 'Priority booking', 'Document uploads'] }
    ]
  });
});

// Payment gateway stub
router.post('/pay', auth, async (req, res) => {
  try {
    // TODO: Integrate with payment gateway (Stripe, Razorpay, etc.)
    res.json({ success: true, message: 'Payment processed (stub)' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
