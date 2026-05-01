import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { io } from 'socket.io-client';
import { imgUrl } from '../utils/imageUrl';
import { useAuth } from '../App';
import { PaperAirplaneIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const AVATAR_COLORS = [
  'bg-primary-500', 'bg-purple-500', 'bg-green-500',
  'bg-orange-500', 'bg-pink-500', 'bg-teal-500'
];

function Avatar({ name, avatarFile, size = 'sm' }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const color = AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const sizeClass = size === 'sm' ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base';
  if (avatarFile) {
    return <img src={imgUrl(avatarFile)} alt={name} className={`${sizeClass} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${color} ${sizeClass} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function timeAgo(dateStr, lang) {
  const diff = Date.now() - new Date(dateStr.includes('T') || dateStr.endsWith('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z').getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === 'fr' ? "à l'instant" : 'just now';
  if (mins < 60) return lang === 'fr' ? `il y a ${mins} min` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === 'fr' ? `il y a ${hours}h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return lang === 'fr' ? `il y a ${days}j` : `${days}d ago`;
}

export default function Messages() {
  const { userId } = useParams();
  const { t, i18n } = useTranslation();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [input, setInput] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);

  const isMobile = window.innerWidth < 768;
  const showList = !userId || !isMobile;
  const showChat = !!userId;

  // Connect socket
  useEffect(() => {
    if (!token) return;
    const SOCKET_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('messages_read', ({ by }) => {
      setMessages(prev => prev.map(m =>
        m.sender_id === user.id && m.receiver_id === by ? { ...m, read: 1 } : m
      ));
      // Update conversation list: mark last message as read if it was sent by me to 'by'
      setConversations(prev => prev.map(c =>
        c.id === by && c.last_sender_id === user.id ? { ...c, last_message_read: 1 } : c
      ));
    });

    socket.on('new_message', (msg) => {
      // Update conversation list
      setConversations(prev => {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const existing = prev.find(c => c.id === otherId);
        if (existing) {
          return prev.map(c => c.id === otherId
            ? { ...c, last_message: msg.content, last_message_at: msg.created_at, last_sender_id: msg.sender_id, unread_count: msg.sender_id !== user.id ? (c.unread_count || 0) + 1 : c.unread_count }
            : c
          ).sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
        }
        return prev;
      });

      // Add to current chat if it's the active conversation
      setMessages(prev => {
        const activeId = parseInt(userId);
        if (msg.sender_id === activeId || msg.receiver_id === activeId) {
          return [...prev, msg];
        }
        return prev;
      });
    });

    return () => socket.disconnect();
  }, [token, user?.id]);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    setLoadingConv(true);
    axios.get('/api/messages/conversations')
      .then(res => setConversations(res.data.conversations))
      .finally(() => setLoadingConv(false));
  }, [user]);

  // Load messages when userId changes
  useEffect(() => {
    if (!userId) return;
    setLoadingMsg(true);
    axios.get(`/api/messages/${userId}`)
      .then(res => {
        setMessages(res.data.messages);
        setOtherUser(res.data.otherUser);
        // Mark as read in conversation list
        setConversations(prev => prev.map(c => c.id === parseInt(userId) ? { ...c, unread_count: 0 } : c));
      })
      .finally(() => setLoadingMsg(false));
  }, [userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !userId || !socketRef.current) return;
    socketRef.current.emit('send_message', { receiverId: parseInt(userId), content: input.trim() });
    setInput('');
  }, [input, userId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">{t('auth.login_required')}</p>
        <Link to="/login" className="btn-primary mt-4 inline-block">{t('auth.login')}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="card overflow-hidden" style={{ height: 'calc(100vh - 140px)', minHeight: '500px' }}>
        <div className="flex h-full">

          {/* Conversations list */}
          <div className={`${showChat && isMobile ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-80 border-r border-gray-100 flex-shrink-0`}>
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{t('messages.title')}</h2>
            </div>
            <div className="overflow-y-auto flex-1">
              {loadingConv ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">{t('messages.no_conversations')}</div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => navigate(`/messages/${conv.id}`)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 ${parseInt(userId) === conv.id ? 'bg-primary-50' : ''}`}
                  >
                    <Avatar name={conv.name} avatarFile={conv.avatar} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm truncate ${conv.unread_count > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>{conv.name}</span>
                        <span className={`text-xs flex-shrink-0 ml-1 ${conv.unread_count > 0 ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>{timeAgo(conv.last_message_at, i18n.language)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                          {conv.last_sender_id === user.id ? (i18n.language === 'fr' ? 'Vous : ' : 'You: ') : ''}{conv.last_message}
                        </p>
                        {conv.unread_count > 0 ? (
                          <span className="ml-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                            {conv.unread_count}
                          </span>
                        ) : (
                          <span className={`ml-1 text-xs flex-shrink-0 ${
                            conv.last_sender_id === user.id && !conv.last_message_read
                              ? 'text-gray-400'
                              : 'text-primary-600'
                          }`}>
                            {conv.last_sender_id === user.id
                              ? (conv.last_message_read
                                  ? (i18n.language === 'fr' ? 'Lu' : 'Seen')
                                  : (i18n.language === 'fr' ? 'Remis' : 'Delivered'))
                              : (i18n.language === 'fr' ? 'Lu' : 'Seen')}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat window */}
          {showChat ? (
            <div className="flex flex-col flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                <button onClick={() => navigate('/messages')} className="md:hidden text-gray-500 hover:text-gray-700">
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                {otherUser && (
                  <>
                    <Avatar name={otherUser.name} avatarFile={otherUser.avatar} />
                    <Link to={`/profile/${otherUser.id}`} className="font-semibold text-gray-900 hover:text-primary-700 transition-colors">
                      {otherUser.name}
                    </Link>
                  </>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsg ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-8">{t('messages.start_conversation')}</div>
                ) : (
                  (() => {
                    const myMsgs = messages.filter(m => m.sender_id === user.id);
                    const lastMyMsgId = myMsgs.length > 0 ? myMsgs[myMsgs.length - 1].id : null;
                    return messages.map(msg => {
                      const isMe = msg.sender_id === user.id;
                      const showRead = isMe && msg.id === lastMyMsgId && msg.read === 1;
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2 w-full`}>
                            {!isMe && <Avatar name={msg.sender_name} avatarFile={msg.sender_avatar} size="sm" />}
                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                              isMe
                                ? 'bg-primary-600 text-white rounded-br-sm'
                                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                            }`}>
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={`text-xs mt-1 ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
                                {timeAgo(msg.created_at, i18n.language)}
                              </p>
                            </div>
                          </div>
                          {showRead && (
                            <p className="text-xs text-gray-400 mt-0.5 mr-1">
                              {i18n.language === 'fr' ? 'Vu' : 'Seen'} ✓
                            </p>
                          )}
                        </div>
                      );
                    });
                  })()
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2 items-end">
                  <textarea
                    className="input-field resize-none flex-1"
                    rows={1}
                    placeholder={t('messages.placeholder')}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ maxHeight: '120px' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="btn-primary p-2.5 flex-shrink-0 disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center text-gray-400 text-sm">
              {t('messages.select_conversation')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
