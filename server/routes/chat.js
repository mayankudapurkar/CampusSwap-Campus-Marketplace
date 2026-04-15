const express = require('express');
const router = express.Router();
const { Message, Conversation } = require('../models/Chat');
const { protect } = require('../middleware/auth');

// @GET /api/chat/conversations - Get all conversations for user
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate('participants', 'name avatar isOnline lastSeen')
      .populate('listing', 'title images price type status')
      .populate('lastMessage')
      .sort('-lastMessageAt');

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// @GET /api/chat/conversations/:id/messages - Get messages in conversation
router.get('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'name avatar')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Mark messages as read
    await Message.updateMany(
      { conversation: req.params.id, sender: { $ne: req.user._id }, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    // Reset unread count for this user
    const unreadCount = conversation.unreadCount || {};
    unreadCount[req.user._id.toString()] = 0;
    conversation.unreadCount = unreadCount;
    await conversation.save({ validateBeforeSave: false });

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// @POST /api/chat/conversations - Start or get conversation
router.post('/conversations', protect, async (req, res) => {
  try {
    const { recipientId, listingId } = req.body;

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot start conversation with yourself' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] },
      listing: listingId || null
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
        listing: listingId || null
      });
    }

    await conversation.populate('participants', 'name avatar isOnline lastSeen');
    if (listingId) {
      await conversation.populate('listing', 'title images price type status');
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create conversation' });
  }
});

// @POST /api/chat/conversations/:id/messages - Send message
router.post('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const { content, type = 'text', offerAmount } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = await Message.create({
      conversation: req.params.id,
      sender: req.user._id,
      content,
      type,
      offerAmount
    });

    await message.populate('sender', 'name avatar');

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();

    // Increment unread count for other participants
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== req.user._id.toString()) {
        const currentCount = (conversation.unreadCount && conversation.unreadCount.get
          ? conversation.unreadCount.get(participantId.toString())
          : 0) || 0;
        if (!conversation.unreadCount) conversation.unreadCount = {};
        conversation.unreadCount[participantId.toString()] = currentCount + 1;
      }
    });

    await conversation.save({ validateBeforeSave: false });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// @GET /api/chat/unread-count - Get total unread count
router.get('/unread-count', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id });
    let totalUnread = 0;

    conversations.forEach(conv => {
      if (conv.unreadCount) {
        const count = conv.unreadCount instanceof Map
          ? conv.unreadCount.get(req.user._id.toString())
          : conv.unreadCount[req.user._id.toString()];
        totalUnread += count || 0;
      }
    });

    res.json({ unreadCount: totalUnread });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get unread count' });
  }
});

module.exports = router;
