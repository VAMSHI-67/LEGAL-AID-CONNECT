const express = require('express');
const { auth } = require('../middleware/auth');
const Case = require('../models/Case');

const router = express.Router();

/**
 * @route   GET /api/chat/rooms
 * @desc    Get user's chat rooms (derived from active cases)
 * @access  Private
 */
router.get('/rooms', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find cases where user is client or assigned lawyer
    const cases = await Case.find({
      $or: [{ clientId: userId }, { lawyerId: userId }],
      status: { $ne: 'cancelled' }
    })
      .select('title status category lawyerId clientId messages updatedAt')
      .populate('lawyerId', 'name profilePicture')
      .populate('clientId', 'name profilePicture')
      .sort({ updatedAt: -1 });

    const rooms = cases.map(c => {
      const participant = req.user.role === 'client' ? c.lawyerId : c.clientId;
      const lastMsg = c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;

      return {
        id: c._id,
        title: c.title,
        status: c.status,
        category: c.category,
        participant: participant || { name: 'Unassigned', profilePicture: null },
        lastMessage: lastMsg ? {
          content: lastMsg.content,
          createdAt: lastMsg.createdAt,
          senderId: lastMsg.senderId
        } : null,
        unreadCount: c.messages ? c.messages.filter(m => !m.isRead && m.receiverId?.toString() === userId.toString()).length : 0,
        updatedAt: c.updatedAt
      };
    });

    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('❌ Chat Rooms Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/chat/rooms/:id/messages
 * @desc    Get messages for a specific case (room)
 * @access  Private
 */
router.get('/rooms/:id/messages', auth, async (req, res) => {
  try {
    const chatCase = await Case.findById(req.params.id)
      .select('messages clientId lawyerId')
      .populate('messages.senderId', 'name profilePicture');

    if (!chatCase) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }

    // Security check: user must be client or lawyer for this case
    if (chatCase.clientId.toString() !== req.user.id && (chatCase.lawyerId && chatCase.lawyerId.toString() !== req.user.id)) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    res.json({
      success: true,
      data: chatCase.messages
    });
  } catch (error) {
    console.error('❌ Chat Messages Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/chat/rooms/:id/messages
 * @desc    Send a message in a chat room
 * @access  Private
 */
router.post('/rooms/:id/messages', auth, async (req, res) => {
  try {
    const { content, type, attachments } = req.body;
    const chatCase = await Case.findById(req.params.id);

    if (!chatCase) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }

    // Security check
    const isClient = chatCase.clientId.toString() === req.user.id;
    const isLawyer = chatCase.lawyerId?.toString() === req.user.id;

    if (!isClient && !isLawyer) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const receiverId = isClient ? chatCase.lawyerId : chatCase.clientId;

    if (!receiverId && !isClient) {
      // Allow client to send message even if no lawyer assigned yet (saved for when lawyer is assigned)
    }

    const newMessage = {
      senderId: req.user.id,
      receiverId: receiverId || chatCase.clientId, // Fallback if needed
      content: content || '',
      type: type || 'text',
      attachments: attachments || [],
      createdAt: new Date(),
      isRead: false
    };

    chatCase.messages.push(newMessage);
    await chatCase.save();

    // Emit via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`case_${chatCase._id}`).emit('case_message', {
        ...newMessage,
        caseId: chatCase._id,
        sender: {
          id: req.user.id,
          name: req.user.name
        }
      });
    }

    res.json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    console.error('❌ Send Message Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   PATCH /api/chat/rooms/:id/read
 * @desc    Mark all messages in a room as read
 * @access  Private
 */
router.patch('/rooms/:id/read', auth, async (req, res) => {
  try {
    const chatCase = await Case.findById(req.params.id);
    if (!chatCase) return res.status(404).json({ success: false, message: 'Room not found' });

    let updated = false;
    chatCase.messages.forEach(msg => {
      if (msg.receiverId?.toString() === req.user.id && !msg.isRead) {
        msg.isRead = true;
        updated = true;
      }
    });

    if (updated) {
      await chatCase.save();
    }

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;