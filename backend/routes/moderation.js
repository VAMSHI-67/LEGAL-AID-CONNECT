const express = require('express');
const { auth, requireAdmin } = require('../middleware/auth');
const Case = require('../models/Case');
const User = require('../models/User');
const router = express.Router();

// Moderate inappropriate case content
router.put('/case/:id/moderate', auth, requireAdmin, async (req, res) => {
  try {
    const { action, reason } = req.body;
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    caseDoc.moderation = { action, reason, moderatedAt: new Date() };
    await caseDoc.save();
    res.json({ success: true, case: caseDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Moderate user (ban/suspend)
router.put('/user/:id/moderate', auth, requireAdmin, async (req, res) => {
  try {
    const { action, reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.moderation = { action, reason, moderatedAt: new Date() };
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
