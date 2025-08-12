const express = require('express');
const { auth, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Case = require('../models/Case');

const router = express.Router();

// @route   GET /api/admin/users
// @desc    Get all users (admin only)
// @access  Private (Admin only)
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password -verificationToken -resetPasswordToken');
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/verify
// @desc    Verify a user (admin only)
// @access  Private (Admin only)
router.put('/users/:id/verify', auth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isVerified = true;
    await user.save();

    res.json({
      success: true,
      message: 'User verified successfully',
      data: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get platform analytics (admin only)
// @access  Private (Admin only)
router.get('/analytics', auth, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalLawyers = await User.countDocuments({ role: 'lawyer' });
    const totalCases = await Case.countDocuments();
    const activeCases = await Case.countDocuments({ status: { $in: ['pending', 'assigned', 'in_progress'] } });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalClients,
        totalLawyers,
        totalCases,
        activeCases
      }
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