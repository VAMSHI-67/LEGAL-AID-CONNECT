const express = require('express');
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const Case = require('../models/Case');
const User = require('../models/User');
const matchmaking = require('../utils/matchmaking');
const Notification = require('../models/Notification');

const router = express.Router();

// --- Utilities & Security Helpers ---
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Very basic content sanitizer (defense-in-depth). Consider replacing with a robust lib (e.g. DOMPurify server-side equivalent) if rich text allowed.
function sanitizeContent(str = '') {
  if (typeof str !== 'string') return '';
  // Remove script tags and inline event handlers
  let cleaned = str.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/ on\w+="[^"]*"/g, '');
  // Escape basic HTML entities
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  cleaned = cleaned.replace(/[&<>"']/g, ch => map[ch]);
  return cleaned.trim();
}

// Helper: base projection for lawyer info
const LAWYER_PUBLIC_FIELDS = 'name email specialization experience rating availability languages location barNumber barState';

// @route   GET /api/cases
// @desc    Get cases for the authenticated user (role-based) or all for admin; supports status filtering
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query; // status can be comma-separated list
    const query = {};

    if (req.user.role === 'client') {
      query.clientId = req.user._id;
    } else if (req.user.role === 'lawyer') {
      query.lawyerId = req.user._id;
    } else if (req.user.role === 'admin') {
      // admin sees all; optional future filters
    }

    if (status) {
      const statuses = String(status).split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length) {
        query.status = { $in: statuses };
      }
    }

    const results = await Case.find(query)
      .populate('clientId', 'name email')
      .populate('lawyerId', LAWYER_PUBLIC_FIELDS)
      .sort({ createdAt: -1 });

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('❌ Error fetching cases:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
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

    // Process tags if provided
    let tags = [];
    if (req.body.tags) {
      if (typeof req.body.tags === 'string') {
        // Handle comma-separated string
        tags = req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(req.body.tags)) {
        // Handle array
        tags = req.body.tags.filter(tag => tag && tag.trim().length > 0);
      }
    }

    const caseData = {
      ...req.body,
      tags,
      clientId: req.user._id
    };

    console.log('🔍 Creating case with data:', caseData);

    const newCase = new Case(caseData);
    await newCase.save();

    console.log('✅ Case created successfully:', newCase._id);

    // Attempt auto-assignment via matchmaking (development: include unverified)
    let assignedMatch = null;
    try {
      const matches = await matchmaking.findMatchedLawyers(newCase.toObject(), 3, { includeUnverified: true });
      if (matches && matches.length > 0) {
        // Choose top match above a minimum score threshold
        const top = matches[0];
        if (top.score >= 40) { // threshold can be tuned
          newCase.lawyerId = top.lawyer._id;
          newCase.status = 'assigned';
          const assignedAt = new Date();
          newCase.matchInfo = { score: top.score, reasons: top.matchReasons, assignedAt };
          newCase.assignmentHistory = newCase.assignmentHistory || [];
          newCase.assignmentHistory.push({ lawyerId: top.lawyer._id, score: top.score, reasons: top.matchReasons, assignedAt });
          await newCase.save();
          // Increment lawyer statistics only once per case lawyer (initial assignment)
          await User.findByIdAndUpdate(top.lawyer._id, { $inc: { totalCases: 1 } });
          // Notifications (fire & forget)
          try {
            await Notification.create({ userId: newCase.clientId, title: 'Lawyer Assigned', message: 'A lawyer was auto-assigned to your case.', type: 'info', relatedId: String(newCase._id) });
            await Notification.create({ userId: top.lawyer._id, title: 'New Case Assigned', message: `You were assigned case: ${newCase.title}`, type: 'success', relatedId: String(newCase._id) });
          } catch (nErr) { console.warn('Notification create failed (auto-assign):', nErr.message); }
          assignedMatch = {
            lawyer: top.lawyer,
            score: top.score,
            reasons: top.matchReasons
          };
          console.log(`🤝 Auto-assigned lawyer ${top.lawyer._id} to case ${newCase._id} (score ${top.score})`);
        } else {
          console.log('ℹ️ Top match score below threshold; leaving case unassigned. Score:', top.score);
        }
      } else {
        console.log('ℹ️ No suitable lawyer matches found for auto-assignment.');
      }
    } catch (mmErr) {
      console.error('Matchmaking error (non-fatal):', mmErr.message);
    }

    res.status(201).json({
      success: true,
      message: assignedMatch ? 'Case created and lawyer auto-assigned' : 'Case created successfully',
      data: newCase,
      assignedMatch
    });
  } catch (error) {
    console.error('❌ Case creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/cases/:id
// @desc    Update a case (only while pending & owned by client)
// @access  Private (Client owner)
router.put('/:id', auth, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    if (caseDoc.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this case' });
    }
    if (caseDoc.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Case can only be edited while pending' });
    }

    const editableFields = ['title', 'description', 'category', 'priority', 'budget', 'tags', 'location'];
    editableFields.forEach(field => {
      if (field in req.body) {
        caseDoc[field] = req.body[field];
      }
    });

    // Normalize tags if provided
    if (req.body.tags) {
      if (Array.isArray(req.body.tags)) {
        caseDoc.tags = req.body.tags.filter(t => t && t.trim()).map(t => t.trim());
      } else if (typeof req.body.tags === 'string') {
        caseDoc.tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    await caseDoc.save();
    const populated = await Case.findById(caseDoc._id)
      .populate('clientId', 'name email')
      .populate('lawyerId', LAWYER_PUBLIC_FIELDS);
    res.json({ success: true, message: 'Case updated', data: populated });
  } catch (error) {
    console.error('❌ Case update error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// (Removed duplicate GET / route; consolidated above with status filtering and admin support)

// @route   GET /api/cases/:id
// @desc    Get case by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid case id' });
  }
  try {
    const caseData = await Case.findById(req.params.id)
      .populate('clientId', 'name email')
      .populate('lawyerId', LAWYER_PUBLIC_FIELDS);

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

// @route   POST /api/cases/:id/rematch
// @desc    Re-run matchmaking and optionally reassign a lawyer
// @access  Private (Client owner or admin)
router.post('/:id/rematch', auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid case id' });
  }
  try {
    const caseDoc = await Case.findById(req.params.id).populate('clientId', 'name email').populate('lawyerId', LAWYER_PUBLIC_FIELDS);
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    // Authorization: client owner or admin
    if (caseDoc.clientId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to rematch this case' });
    }

    // Run matchmaking excluding current lawyer
    const rawCase = caseDoc.toObject();
    const currentLawyerId = caseDoc.lawyerId ? caseDoc.lawyerId._id.toString() : null;
    let matches = [];
    try {
      matches = await matchmaking.findMatchedLawyers(rawCase, 5, { includeUnverified: true });
    } catch (e) {
      console.error('Rematch matchmaking error:', e.message);
      return res.status(500).json({ success: false, message: 'Matchmaking failed', error: e.message });
    }

    // Filter out current lawyer if present
    if (currentLawyerId) {
      matches = matches.filter(m => m.lawyer._id.toString() !== currentLawyerId);
    }

    if (!matches.length) {
      return res.status(200).json({ success: true, message: 'No alternative lawyer matches found', data: caseDoc });
    }

    const top = matches[0];
    if (top.score < 40) {
      return res.status(200).json({ success: true, message: 'Top alternative match below threshold; no reassignment made', candidate: { lawyer: top.lawyer, score: top.score }, data: caseDoc });
    }

    // Reassign with history tracking
    const now = new Date();
    if (caseDoc.lawyerId) {
      // Close out previous assignment in history
      if (!Array.isArray(caseDoc.assignmentHistory)) caseDoc.assignmentHistory = [];
      const lastEntry = caseDoc.assignmentHistory.find(h => h.lawyerId.toString() === caseDoc.lawyerId.toString() && !h.unassignedAt);
      if (lastEntry) lastEntry.unassignedAt = now;
    }
  const previousLawyerId = caseDoc.lawyerId ? caseDoc.lawyerId.toString() : null;
  caseDoc.lawyerId = top.lawyer._id;
  caseDoc.status = 'assigned';
  caseDoc.lawyerAccepted = false; // requires acceptance
    caseDoc.matchInfo = { score: top.score, reasons: top.matchReasons, assignedAt: now };
    if (!Array.isArray(caseDoc.assignmentHistory)) caseDoc.assignmentHistory = [];
    caseDoc.assignmentHistory.push({ lawyerId: top.lawyer._id, score: top.score, reasons: top.matchReasons, assignedAt: now, reason: 'Rematch reassignment' });
    caseDoc.timeline.push({ action: 'Lawyer re-assigned', description: 'Lawyer changed via rematch', performedBy: req.user._id, timestamp: now });
    await caseDoc.save();
    // Increment totalCases only if this lawyer hasn't been assigned to this case before
    const hasPrior = caseDoc.assignmentHistory.filter(h => h.lawyerId.toString() === top.lawyer._id.toString()).length > 1;
    if (!hasPrior) {
      await User.findByIdAndUpdate(top.lawyer._id, { $inc: { totalCases: 1 } });
    }
    // Notifications
    try {
      await Notification.create({ userId: caseDoc.clientId, title: 'Lawyer Reassigned', message: 'Your case has a new assigned lawyer.', type: 'warning', relatedId: String(caseDoc._id) });
      await Notification.create({ userId: top.lawyer._id, title: 'New Case Assigned', message: `You were assigned case: ${caseDoc.title}`, type: 'success', relatedId: String(caseDoc._id) });
      if (previousLawyerId && previousLawyerId !== top.lawyer._id.toString()) {
        await Notification.create({ userId: previousLawyerId, title: 'Case Unassigned', message: `You are no longer assigned to case: ${caseDoc.title}`, type: 'info', relatedId: String(caseDoc._id) });
      }
    } catch (nErr) { console.warn('Notification create failed (rematch):', nErr.message); }

    const updated = await Case.findById(caseDoc._id)
      .populate('clientId', 'name email')
      .populate('lawyerId', LAWYER_PUBLIC_FIELDS);

    res.json({ success: true, message: 'Case reassigned', data: updated, assignedMatch: { lawyer: top.lawyer, score: top.score, reasons: top.matchReasons } });
  } catch (error) {
    console.error('❌ Rematch error:', error);
    res.status(500).json({ success: false, message: 'Server error during rematch', error: error.message });
  }
});

module.exports = router; 

// @route   POST /api/cases/:id/assign
// @desc    Manually assign or reassign a lawyer (client owner or admin)
// @access  Private
router.post('/:id/assign', auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid case id' });
  }
  try {
    const { lawyerId } = req.body;
    if (!lawyerId || !isValidObjectId(lawyerId)) return res.status(400).json({ success: false, message: 'Valid lawyerId required' });
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    if (caseDoc.clientId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const lawyer = await User.findById(lawyerId);
    if (!lawyer || lawyer.role !== 'lawyer') return res.status(400).json({ success: false, message: 'Invalid lawyer' });

    const now = new Date();
    const previousLawyerId = caseDoc.lawyerId ? caseDoc.lawyerId.toString() : null;
    if (previousLawyerId === lawyerId) {
      return res.json({ success: true, message: 'Lawyer already assigned', data: caseDoc });
    }
    if (caseDoc.lawyerId) {
      const lastEntry = caseDoc.assignmentHistory?.find(h => h.lawyerId.toString() === caseDoc.lawyerId.toString() && !h.unassignedAt);
      if (lastEntry) lastEntry.unassignedAt = now;
    }
    caseDoc.lawyerId = lawyer._id;
  caseDoc.status = 'assigned';
  caseDoc.lawyerAccepted = false; // reset acceptance required
    caseDoc.matchInfo = caseDoc.matchInfo || { score: 0, reasons: [], assignedAt: now };
    caseDoc.matchInfo.assignedAt = now;
    if (!Array.isArray(caseDoc.assignmentHistory)) caseDoc.assignmentHistory = [];
    caseDoc.assignmentHistory.push({ lawyerId: lawyer._id, assignedAt: now, reason: 'Manual assignment' });
    caseDoc.timeline.push({ action: 'Lawyer assigned (manual)', performedBy: req.user._id, timestamp: now });
    await caseDoc.save();
    // Increment totalCases only if first time
    const repeatCount = caseDoc.assignmentHistory.filter(h => h.lawyerId.toString() === lawyer._id.toString()).length;
    if (repeatCount === 1) await User.findByIdAndUpdate(lawyer._id, { $inc: { totalCases: 1 } });
    try {
      await Notification.create({ userId: caseDoc.clientId, title: 'Lawyer Assigned', message: 'A lawyer was manually assigned to your case.', type: 'info', relatedId: String(caseDoc._id) });
      await Notification.create({ userId: lawyer._id, title: 'New Case Assigned', message: `You were manually assigned case: ${caseDoc.title}`, type: 'success', relatedId: String(caseDoc._id) });
      if (previousLawyerId && previousLawyerId !== lawyer._id.toString()) {
        await Notification.create({ userId: previousLawyerId, title: 'Case Unassigned', message: `You are no longer assigned to case: ${caseDoc.title}`, type: 'info', relatedId: String(caseDoc._id) });
      }
    } catch (nErr) { console.warn('Notification create failed (manual assign):', nErr.message); }
    const populated = await Case.findById(caseDoc._id).populate('lawyerId', LAWYER_PUBLIC_FIELDS).populate('clientId','name email');
    res.json({ success: true, message: 'Lawyer assigned', data: populated });
  } catch (error) {
    console.error('Manual assignment error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/cases/:id/messages
// @desc    Get case messages
// @access  Private (client owner, assigned lawyer, admin)
router.get('/:id/messages', auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid case id' });
  }
  try {
    const caseDoc = await Case.findById(req.params.id).select('messages clientId lawyerId');
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    if (caseDoc.clientId.toString() !== req.user._id.toString() && (!caseDoc.lawyerId || caseDoc.lawyerId.toString() !== req.user._id.toString()) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: caseDoc.messages || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/cases/:id/messages
// @desc    Add case message & emit via socket
// @access  Private
router.post('/:id/messages', auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid case id' });
  }
  try {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ success: false, message: 'Content required' });
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    if (caseDoc.clientId.toString() !== req.user._id.toString() && (!caseDoc.lawyerId || caseDoc.lawyerId.toString() !== req.user._id.toString()) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const sanitized = sanitizeContent(content);
    const msg = { senderId: req.user._id, receiverId: (req.user._id.toString() === caseDoc.clientId.toString() ? caseDoc.lawyerId : caseDoc.clientId), content: sanitized, type: 'text', createdAt: new Date(), isRead: false };
    caseDoc.messages.push(msg);
    await caseDoc.save();
    // Notification for receiver
    if (msg.receiverId) {
      try { await Notification.create({ userId: msg.receiverId, title: 'New Message', message: 'You received a new case message.', type: 'info', relatedId: String(caseDoc._id) }); } catch(e){/* ignore */}
    }
    // Emit via socket if available
    try {
      const io = req.app.get('io');
      if (io) io.to(`case_${caseDoc._id}`).emit('case_message', { caseId: caseDoc._id, message: msg });
    } catch(e){ /* ignore */ }
    res.status(201).json({ success: true, data: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/cases/:id/accept
// @desc    Lawyer accepts assigned case (transitions to in_progress)
// @access  Private (Assigned Lawyer)
router.post('/:id/accept', auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid case id' });
  }
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    if (!caseDoc.lawyerId || caseDoc.lawyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned lawyer can accept' });
    }
    if (caseDoc.lawyerAccepted) {
      return res.json({ success: true, message: 'Case already accepted', data: caseDoc });
    }
    caseDoc.lawyerAccepted = true;
    if (caseDoc.status === 'assigned') {
      caseDoc.status = 'in_progress';
    }
    caseDoc.timeline.push({ action: 'Lawyer accepted case', performedBy: req.user._id, timestamp: new Date() });
    await caseDoc.save();
    try {
      await Notification.create({ userId: caseDoc.clientId, title: 'Case In Progress', message: 'Your lawyer accepted the case.', type: 'success', relatedId: String(caseDoc._id) });
    } catch(e){ /* ignore */ }
    const populated = await Case.findById(caseDoc._id).populate('lawyerId', LAWYER_PUBLIC_FIELDS).populate('clientId','name email');
    res.json({ success: true, message: 'Case accepted', data: populated });
  } catch (error) {
    console.error('Accept case error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/cases/:id/decline
// @desc    Assigned lawyer declines case -> unassign & revert to pending
// @access  Private (Assigned Lawyer)
router.post('/:id/decline', auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid case id' });
  }
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    if (!caseDoc.lawyerId || caseDoc.lawyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned lawyer can decline' });
    }
    const now = new Date();
    if (!Array.isArray(caseDoc.assignmentHistory)) caseDoc.assignmentHistory = [];
    const currentEntry = caseDoc.assignmentHistory.find(h => h.lawyerId.toString() === caseDoc.lawyerId.toString() && !h.unassignedAt);
    if (currentEntry) currentEntry.unassignedAt = now;
    caseDoc.timeline.push({ action: 'Lawyer declined case', performedBy: req.user._id, timestamp: now });
    const previousLawyerId = caseDoc.lawyerId;
    caseDoc.lawyerId = null;
    caseDoc.lawyerAccepted = false;
    caseDoc.status = 'pending';
    await caseDoc.save();
    try {
      await Notification.create({ userId: caseDoc.clientId, title: 'Lawyer Declined', message: 'Assigned lawyer declined. Searching for another.', type: 'warning', relatedId: String(caseDoc._id) });
      await Notification.create({ userId: previousLawyerId, title: 'Case Declined', message: 'You have declined the case.', type: 'info', relatedId: String(caseDoc._id) });
    } catch(e){ /* ignore */ }
    const populated = await Case.findById(caseDoc._id).populate('clientId','name email');
    res.json({ success: true, message: 'Case reverted to pending', data: populated });
  } catch (error) {
    console.error('Decline case error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/cases/:id/unassign
// @desc    Client or admin unassigns current lawyer (does not delete history)
// @access  Private (Client owner or Admin)
router.post('/:id/unassign', auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid case id' });
  }
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    if (caseDoc.clientId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to unassign' });
    }
    if (!caseDoc.lawyerId) {
      return res.json({ success: true, message: 'No lawyer assigned', data: caseDoc });
    }
    const now = new Date();
    if (!Array.isArray(caseDoc.assignmentHistory)) caseDoc.assignmentHistory = [];
    const currentEntry = caseDoc.assignmentHistory.find(h => h.lawyerId.toString() === caseDoc.lawyerId.toString() && !h.unassignedAt);
    if (currentEntry) currentEntry.unassignedAt = now;
    const previousLawyerId = caseDoc.lawyerId;
    caseDoc.timeline.push({ action: 'Lawyer unassigned', performedBy: req.user._id, timestamp: now });
    caseDoc.lawyerId = null;
    caseDoc.lawyerAccepted = false;
    caseDoc.status = 'pending';
    await caseDoc.save();
    try {
      await Notification.create({ userId: caseDoc.clientId, title: 'Lawyer Unassigned', message: 'The lawyer has been unassigned from your case.', type: 'warning', relatedId: String(caseDoc._id) });
      await Notification.create({ userId: previousLawyerId, title: 'Case Unassigned', message: 'You have been unassigned from the case.', type: 'info', relatedId: String(caseDoc._id) });
    } catch(e){ /* ignore */ }
    const populated = await Case.findById(caseDoc._id).populate('clientId','name email');
    res.json({ success: true, message: 'Lawyer unassigned', data: populated });
  } catch (error) {
    console.error('Unassign lawyer error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});