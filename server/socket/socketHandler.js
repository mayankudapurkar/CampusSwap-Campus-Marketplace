const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Message, Conversation } = require('../models/Chat');
const Notification = require('../models/Notification');

const onlineUsers = new Map(); // userId -> socketId

module.exports = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`✅ User connected: ${socket.user.name} (${userId})`);

    // Store socket and mark online
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

    // Broadcast online status
    socket.broadcast.emit('user_online', { userId });

    // Join personal room
    socket.join(`user_${userId}`);

    // Join all conversation rooms
    const conversations = await Conversation.find({ participants: userId });
    conversations.forEach(conv => socket.join(`conv_${conv._id}`));

    // Handle sending message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, type = 'text', offerAmount } = data;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.map(p => p.toString()).includes(userId)) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: socket.user._id,
          content,
          type,
          offerAmount
        });

        await message.populate('sender', 'name avatar');

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();

        // Update unread counts for others
        conversation.participants.forEach(participantId => {
          const pid = participantId.toString();
          if (pid !== userId) {
            const currentCount = (conversation.unreadCount && 
              (conversation.unreadCount.get ? conversation.unreadCount.get(pid) : conversation.unreadCount[pid])) || 0;
            if (!conversation.unreadCount) conversation.unreadCount = {};
            if (typeof conversation.unreadCount.set === 'function') {
              conversation.unreadCount.set(pid, currentCount + 1);
            } else {
              conversation.unreadCount[pid] = currentCount + 1;
            }
          }
        });

        await conversation.save({ validateBeforeSave: false });

        // Emit to conversation room
        io.to(`conv_${conversationId}`).emit('new_message', message);

        // Notify offline recipients
        conversation.participants.forEach(async (participantId) => {
          const pid = participantId.toString();
          if (pid !== userId) {
            // Send notification
            const notification = await Notification.create({
              recipient: participantId,
              sender: socket.user._id,
              type: 'new_message',
              title: `New message from ${socket.user.name}`,
              body: content.substring(0, 50),
              link: `/chat/${conversationId}`
            });

            // Emit notification to recipient's room
            io.to(`user_${pid}`).emit('new_notification', notification);
            io.to(`user_${pid}`).emit('update_unread_count');
          }
        });
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing
    socket.on('typing_start', ({ conversationId }) => {
      socket.to(`conv_${conversationId}`).emit('typing', {
        userId,
        name: socket.user.name,
        conversationId
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conv_${conversationId}`).emit('stop_typing', { userId, conversationId });
    });

    // Handle joining specific conversation
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv_${conversationId}`);
    });

    // Handle read receipts
    socket.on('messages_read', async ({ conversationId }) => {
      try {
        await Message.updateMany(
          { conversation: conversationId, sender: { $ne: userId }, isRead: false },
          { isRead: true, readAt: new Date() }
        );
        io.to(`conv_${conversationId}`).emit('messages_read', { conversationId, readBy: userId });
      } catch (error) {
        console.error('Read receipt error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.user.name}`);
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      socket.broadcast.emit('user_offline', { userId });
    });
  });
};
