const express = require('express');
const { auth, requireClient, requireLawyer } = require('../middleware/auth');
const Booking = require('../models/Booking');
const router = express.Router();

// Create a booking slot (client)
router.post('/', auth, requireClient, async (req, res) => {
  try {
    const { lawyerId, slot, caseId } = req.body;
    const booking = new Booking({
      clientId: req.user._id,
      lawyerId,
      slot,
      caseId
    });
    await booking.save();
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lawyer: Accept/Reject booking
router.put('/:id/status', auth, requireLawyer, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.lawyerId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    booking.status = status;
    await booking.save();
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get bookings for user
router.get('/my', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ $or: [{ clientId: req.user._id }, { lawyerId: req.user._id }] });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
