import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isUserOnline, setUnreadCount } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [searchConv, setSearchConv] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => { fetchConversations(); }, []);

useEffect(() => {
  if (conversationId && conversations.length > 0) {
    const conv = conversations.find(c => c._id === conversationId);

    // ✅ Prevent repeated calls
    if (conv && (!activeConv || activeConv._id !== conv._id)) {
      openConversation(conv);
    }
  }
}, [conversationId, conversations, activeConv]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (message) => {
      if (activeConv && message.conversation === activeConv._id) {
        setMessages(prev => [...prev, message]);
        socket.emit('messages_read', { conversationId: activeConv._id });
      }
      setConversations(prev => prev.map(c =>
        c._id === message.conversation
          ? { ...c, lastMessage: message, lastMessageAt: message.createdAt }
          : c
      ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)));
    });

    socket.on('typing', ({ userId, name, conversationId: cid }) => {
      if (activeConv && cid === activeConv._id && userId !== user._id) {
        setTyping(true); setTypingUser(name);
      }
    });

    socket.on('stop_typing', ({ conversationId: cid }) => {
      if (activeConv && cid === activeConv._id) { setTyping(false); setTypingUser(''); }
    });

    return () => { socket.off('new_message'); socket.off('typing'); socket.off('stop_typing'); };
  }, [socket, activeConv, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const { data } = await axios.get('/api/chat/conversations');
      setConversations(data);
    } catch (err) {
  console.error("Chat fetch error:", err);
} finally { setLoading(false); }
  };

  const openConversation = async (conv) => {
    if (msgLoading) return; // prevents duplicate calls
    setActiveConv(conv);
    setMsgLoading(true);
    if (conversationId !== conv._id) navigate(`/chat/${conv._id}`, { replace: true });
    socket?.emit('join_conversation', conv._id);
    try {
      const { data } = await axios.get(`/api/chat/conversations/${conv._id}/messages`);
      setMessages(data);
      socket?.emit('messages_read', { conversationId: conv._id });
      setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, unreadCount: { ...c.unreadCount, [user._id]: 0 } } : c));
      setUnreadCount(prev => Math.max(0, prev - (getUnreadForUser(conv, user._id) || 0)));
    } catch (err) {
  console.error("Conversations error:", err);
}finally { setMsgLoading(false); }
  };

  const getUnreadForUser = (conv, uid) => {
    if (!conv.unreadCount) return 0;
    return (conv.unreadCount instanceof Map ? conv.unreadCount.get(uid) : conv.unreadCount[uid]) || 0;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeConv) return;
    const content = input.trim();
    setInput('');

    // Optimistic update
    const tempMsg = { _id: Date.now(), sender: { _id: user._id, name: user.name, avatar: user.avatar }, content, type: 'text', createdAt: new Date().toISOString(), optimistic: true };
    setMessages(prev => [...prev, tempMsg]);

    socket?.emit('stop_typing', { conversationId: activeConv._id });

    try {
      const { data } = await axios.post(`/api/chat/conversations/${activeConv._id}/messages`, { content });
      setMessages(prev => prev.map(m => m._id === tempMsg._id ? data : m));
    } catch {
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
      setInput(content);
    }
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!activeConv || !socket) return;
    socket.emit('typing_start', { conversationId: activeConv._id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socket.emit('stop_typing', { conversationId: activeConv._id }), 1500);
  };

  const getOtherUser = (conv) => conv.participants?.find(p => p._id !== user._id);

  const filteredConvs = conversations.filter(c => {
    const other = getOtherUser(c);
    return !searchConv || other?.name?.toLowerCase().includes(searchConv.toLowerCase()) || c.listing?.title?.toLowerCase().includes(searchConv.toLowerCase());
  });

  const formatMsgTime = (date) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d');
  };

  const groupMessages = (msgs) => {
    const groups = [];
    let current = null;
    msgs.forEach((msg, i) => {
      const date = new Date(msg.createdAt);
      const prevMsg = msgs[i - 1];
      const showDate = !prevMsg || !isSameDay(new Date(prevMsg.createdAt), date);
      const sameSender = prevMsg && prevMsg.sender?._id === msg.sender?._id && !showDate;
      if (!current || showDate || !sameSender) {
        current = { senderId: msg.sender?._id, messages: [], showDate };
        groups.push(current);
      } else { current.showDate = false; }
      current.messages.push(msg);
    });
    return groups;
  };

  const isSameDay = (d1, d2) => d1.toDateString() === d2.toDateString();

  const getDateLabel = (date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface2)' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', maxWidth: 1200, width: '100%', margin: '0 auto', padding: '16px 20px', gap: 16, minHeight: 0 }}>
        {/* Conversations list */}
        <div style={{ width: 320, flexShrink: 0, background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: 'var(--text)' }}>Messages</h2>
            <input value={searchConv} onChange={e => setSearchConv(e.target.value)}
              placeholder="Search conversations..." className="input" style={{ fontSize: 13, padding: '8px 12px', borderRadius: 'var(--radius-md)' }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                  <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 13, borderRadius: 4, marginBottom: 6, width: '70%' }} />
                    <div className="skeleton" style={{ height: 11, borderRadius: 4, width: '90%' }} />
                  </div>
                </div>
              ))
            ) : filteredConvs.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                <p style={{ fontSize: 14, fontWeight: 500 }}>No conversations yet</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Browse listings and contact sellers to start chatting</p>
                <Link to="/listings" className="btn btn-primary" style={{ marginTop: 16, justifyContent: 'center', fontSize: 13 }}>Browse Listings</Link>
              </div>
            ) : filteredConvs.map(conv => {
              const other = getOtherUser(conv);
              const unread = getUnreadForUser(conv, user._id);
              const online = isUserOnline(other?._id);
              const isActive = activeConv?._id === conv._id;

              return (
                <div key={conv._id} onClick={() => openConversation(conv)}
                  style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: isActive ? 'var(--surface3)' : 'white', transition: 'var(--transition)', borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface2)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'white'; }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', overflow: 'hidden', fontSize: 16 }}>
                      {other?.avatar ? <img src={other.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : other?.name?.[0]}
                    </div>
                    {online && <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--success)', border: '2px solid white', position: 'absolute', bottom: 0, right: 0 }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other?.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0, marginLeft: 4 }}>
                        {conv.lastMessageAt && formatMsgTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    {conv.listing && <p style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>re: {conv.listing.title}</p>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {conv.lastMessage?.content || 'No messages yet'}
                      </p>
                      {unread > 0 && <span className="badge" style={{ marginLeft: 6, flexShrink: 0 }}>{unread > 9 ? '9+' : unread}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat window */}
        <div style={{ flex: 1, background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', minWidth: 0 }}>
          {!activeConv ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', padding: 40 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Select a conversation</h3>
              <p style={{ fontSize: 14, textAlign: 'center', maxWidth: 300 }}>Choose a conversation from the left, or start a new one by contacting a seller on a listing page</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              {(() => {
                const other = getOtherUser(activeConv);
                const online = isUserOnline(other?._id);
                return (
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'white' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', overflow: 'hidden', fontSize: 16 }}>
                        {other?.avatar ? <img src={other.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : other?.name?.[0]}
                      </div>
                      {online && <div style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--success)', border: '2px solid white', position: 'absolute', bottom: 0, right: 0 }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Link to={`/profile/${other?._id}`} style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', textDecoration: 'none' }}>{other?.name}</Link>
                      <p style={{ fontSize: 12, color: online ? 'var(--success)' : 'var(--text3)', fontWeight: 500 }}>
                        {online ? '● Online' : other?.lastSeen ? `Last seen ${formatDistanceToNow(new Date(other.lastSeen), { addSuffix: true })}` : '● Offline'}
                      </p>
                    </div>
                    {activeConv.listing && (
                      <Link to={`/listings/${activeConv.listing._id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--surface2)', borderRadius: 'var(--radius-md)', textDecoration: 'none', flexShrink: 0 }}>
                        {activeConv.listing.images?.[0]?.url && <img src={activeConv.listing.images[0].url} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />}
                        <div>
                          <p style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>LISTING</p>
                          <p style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeConv.listing.title}</p>
                        </div>
                      </Link>
                    )}
                  </div>
                );
              })()}

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4, background: '#F9F8FF' }}>
                {msgLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
                    <p style={{ fontWeight: 600, fontSize: 15 }}>Say hello!</p>
                    <p style={{ fontSize: 13, marginTop: 4 }}>Start the conversation about the listing</p>
                  </div>
                ) : (
                  groupMessages(messages).map((group, gi) => (
                    <React.Fragment key={gi}>
                      {group.showDate && (
                        <div style={{ textAlign: 'center', margin: '12px 0 8px' }}>
                          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, background: 'white', padding: '3px 12px', borderRadius: 100, border: '1px solid var(--border)' }}>
                            {getDateLabel(new Date(group.messages[0].createdAt))}
                          </span>
                        </div>
                      )}
                      {group.messages.map((msg, mi) => {
                        const isMe = msg.sender?._id === user._id;
                        const isLast = mi === group.messages.length - 1;
                        return (
                          <div key={msg._id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: isLast ? 4 : 1 }}>
                            {!isMe && isLast && (
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--primary)', overflow: 'hidden', marginRight: 8, flexShrink: 0, alignSelf: 'flex-end' }}>
                                {msg.sender?.avatar ? <img src={msg.sender.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : msg.sender?.name?.[0]}
                              </div>
                            )}
                            {!isMe && !isLast && <div style={{ width: 36 }} />}
                            <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                              <div style={{
                                padding: '10px 14px',
                                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                background: isMe ? 'var(--primary)' : 'white',
                                color: isMe ? 'white' : 'var(--text)',
                                fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                opacity: msg.optimistic ? 0.7 : 1
                              }}>
                                {msg.content}
                              </div>
                              {isLast && (
                                <span style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3, paddingRight: isMe ? 4 : 0, paddingLeft: isMe ? 0 : 4 }}>
                                  {format(new Date(msg.createdAt), 'HH:mm')} {isMe && (msg.isRead ? '✓✓' : '✓')}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))
                )}

                {typing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                      {typingUser?.[0]}
                    </div>
                    <div style={{ background: 'white', borderRadius: '18px 18px 18px 4px', padding: '10px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {[0, 0.2, 0.4].map((delay, i) => (
                          <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text3)', animation: `bounce 1s ${delay}s infinite` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form onSubmit={handleSend} style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-end', background: 'white' }}>
                <input value={input} onChange={handleTyping}
                  placeholder="Type a message..." className="input"
                  style={{ flex: 1, borderRadius: 'var(--radius-lg)', padding: '11px 16px', resize: 'none', fontSize: 14 }} />
                <button type="submit" disabled={!input.trim()} className="btn btn-primary"
                  style={{ padding: '11px 16px', borderRadius: 'var(--radius-lg)', flexShrink: 0, opacity: input.trim() ? 1 : 0.5, transition: 'var(--transition)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
      `}</style>
    </div>
  );
}
