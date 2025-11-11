const express = require('express');
const { auth } = require('../middleware/auth');
const Case = require('../models/Case');
const router = express.Router();

// Send case update alert (stub)
router.post('/case/:id/alert', auth, async (req, res) => {
  try {
    // In production, send email/notification to client/lawyer
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    // TODO: Integrate with notification/email service
    res.json({ success: true, message: 'Alert sent (stub)' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
