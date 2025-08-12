const express = require('express');
const { auth } = require('../middleware/auth');
const Case = require('../models/Case');

const router = express.Router();

// @route   GET /api/cases
// @desc    Get user's cases
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'client') {
      query.clientId = req.user._id;
    } else if (req.user.role === 'lawyer') {
      query.lawyerId = req.user._id;
    }

    const cases = await Case.find(query)
      .populate('clientId', 'name email')
      .populate('lawyerId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: cases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/cases
// @desc    Create a new case
// @access  Private (Clients only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Only clients can create cases'
      });
    }

    const caseData = {
      ...req.body,
      clientId: req.user._id
    };

    const newCase = new Case(caseData);
    await newCase.save();

    res.status(201).json({
      success: true,
      message: 'Case created successfully',
      data: newCase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/cases/:id
// @desc    Get case by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id)
      .populate('clientId', 'name email')
      .populate('lawyerId', 'name email');

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check if user has access to this case
    if (caseData.clientId._id.toString() !== req.user._id.toString() && 
        caseData.lawyerId?._id.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: caseData
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