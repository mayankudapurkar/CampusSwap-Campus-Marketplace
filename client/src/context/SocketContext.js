import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      return;
    }

    socketRef.current = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => console.log('Socket connected'));
    socket.on('user_online', ({ userId }) => setOnlineUsers(prev => new Set([...prev, userId])));
    socket.on('user_offline', ({ userId }) => setOnlineUsers(prev => { const s = new Set(prev); s.delete(userId); return s; }));
    socket.on('update_unread_count', fetchUnreadCount);

    fetchUnreadCount();

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [token, user]);

  const fetchUnreadCount = async () => {
    try {
      const axios = require('axios');
      const { data } = await axios.get('/api/chat/unread-count');
      setUnreadCount(data.unreadCount);
    } catch {}
  };

  const isUserOnline = (userId) => onlineUsers.has(userId);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers, isUserOnline, unreadCount, setUnreadCount, fetchUnreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};
