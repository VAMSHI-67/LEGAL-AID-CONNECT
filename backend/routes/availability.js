const express = require('express');
const { auth, requireLawyer } = require('../middleware/auth');
const Availability = require('../models/Availability');
const router = express.Router();

// Set availability (lawyer)
router.post('/', auth, requireLawyer, async (req, res) => {
  try {
    const { slots } = req.body;
    let availability = await Availability.findOne({ lawyerId: req.user._id });
    if (!availability) {
      availability = new Availability({ lawyerId: req.user._id, slots });
    } else {
      availability.slots = slots;
      availability.updatedAt = Date.now();
    }
    await availability.save();
    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get lawyer availability
router.get('/:lawyerId', async (req, res) => {
  try {
    const availability = await Availability.findOne({ lawyerId: req.params.lawyerId });
    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
