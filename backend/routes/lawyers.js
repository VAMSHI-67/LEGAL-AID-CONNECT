const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const matchmaking = require('../utils/matchmaking');

const router = express.Router();

// @route   GET /api/lawyers
// @desc    Get all lawyers with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { specialization, location, availability, minRating, minExperience } = req.query;
    
    const query = { role: 'lawyer', isActive: true };
    
    if (specialization) {
      query.specialization = { $in: specialization.split(',') };
    }
    
    if (location) {
      if (location.state) query['location.state'] = location.state;
      if (location.district) query['location.district'] = location.district;
    }
    
    if (availability) {
      query.availability = availability;
    }
    
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }
    
    if (minExperience) {
      query.experience = { $gte: parseInt(minExperience) };
    }

    const lawyers = await User.find(query)
      .select('-password -verificationToken -resetPasswordToken')
      .sort({ rating: -1, experience: -1 });

    res.json({
      success: true,
      data: lawyers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/lawyers/matches
// @desc    Get matched lawyers for a case using matchmaking algorithm
// @access  Private
router.get('/matches', auth, async (req, res) => {
  try {
    const { caseId, limit } = req.query;
    if (!caseId) {
      return res.status(400).json({ success: false, message: 'caseId is required' });
    }
    const Case = require('../models/Case');
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    // Authorization: client owner, assigned lawyer, or admin
    if (caseDoc.clientId.toString() !== req.user._id.toString() && (!caseDoc.lawyerId || caseDoc.lawyerId.toString() !== req.user._id.toString()) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view matches for this case' });
    }
    const matches = await matchmaking.findMatchedLawyers(caseDoc.toObject(), parseInt(limit) || 10, { includeUnverified: true });
    res.json({ success: true, data: matches });
  } catch (error) {
    console.error('Match retrieval error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/lawyers/:id
// @desc    Get lawyer by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const lawyer = await User.findOne({ 
      _id: req.params.id, 
      role: 'lawyer' 
    }).select('-password -verificationToken -resetPasswordToken');

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer not found'
      });
    }

    res.json({
      success: true,
      data: lawyer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router; 