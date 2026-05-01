import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { io } from 'socket.io-client';
import { imgUrl } from '../utils/imageUrl';
import { useAuth } from '../App';
import { PaperAirplaneIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const AVATAR_COLORS = [
  'bg-blue-900', 'bg-purple-900', 'bg-emerald-900',
  'bg-orange-900', 'bg-rose-900', 'bg-teal-900'
];

function Avatar({ name, avatarFile, size = 'sm' }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const color = AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const sizeClass = size === 'sm' ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base';
  
  if (avatarFile) {
    return <img src={imgUrl(avatarFile)} alt={name} className={`${sizeClass} rounded-full object-cover flex-shrink-0 border border-white/10`} />;
  }
  return (
    <div className={`${color} ${sizeClass} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 border border-white/10 shadow-inner`}>
      {initials}
    </div>
  );
}

function timeAgo(dateStr, lang) {
  const diff = Date.now() - new Date(dateStr.includes('T') || dateStr.endsWith('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z').getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang.startsWith('fr') ? "à l'instant" : 'just now';
  if (mins < 60) return lang.startsWith('fr') ? `il y a ${mins} min` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang.startsWith('fr') ? `il y a ${hours}h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return lang.startsWith('fr') ? `il y a ${days}j` : `${days}d ago`;
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
      setConversations(prev => prev.map(c =>
        c.id === by && c.last_sender_id === user.id ? { ...c, last_message_read: 1 } : c
      ));
    });

    socket.on('new_message', (msg) => {
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

  // Load messages
  useEffect(() => {
    if (!userId) return;
    setLoadingMsg(true);
    axios.get(`/api/messages/${userId}`)
      .then(res => {
        setMessages(res.data.messages);
        setOtherUser(res.data.otherUser);
        setConversations(prev => prev.map(c => c.id === parseInt(userId) ? { ...c, unread_count: 0 } : c));
      })
      .finally(() => setLoadingMsg(false));
  }, [userId]);

  // Scroll to bottom
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
      <div className="bg-luxuryBlack min-h-screen pt-20">
        <div className="max-w-xl mx-auto px-4 text-center bg-luxuryDark border border-white/5 p-12 rounded-[40px]">
          <h2 className="text-2xl font-display font-bold text-white mb-4">{t('auth.login_required')}</h2>
          <Link to="/login" className="btn-primary inline-block px-8 py-3">{t('auth.login')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-luxuryBlack min-h-screen pt-8 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100vh-140px)] min-h-[600px]">
        <div className="flex h-full bg-luxuryDark border border-white/5 rounded-3xl overflow-hidden shadow-2xl">

          {/* Conversations List (Sidebar) */}
          <div className={`${showChat && isMobile ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-80 lg:w-96 border-r border-white/5 flex-shrink-0 bg-black/20`}>
            <div className="p-6 border-b border-white/5 bg-luxuryDark/50 backdrop-blur-md">
              <h2 className="font-display font-black text-white text-xl uppercase tracking-widest">{t('messages.title') || 'Messagerie'}</h2>
            </div>
            
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {loadingConv ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gnYellow"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm font-medium">{t('messages.no_conversations') || 'Aucune conversation'}</div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => navigate(`/messages/${conv.id}`)}
                    className={`w-full flex items-center gap-4 p-5 transition-all text-left border-b border-white/5 ${
                      parseInt(userId) === conv.id 
                        ? 'bg-white/10 border-l-2 border-l-gnYellow' 
                        : 'hover:bg-white/5 border-l-2 border-l-transparent'
                    }`}
                  >
                    <Avatar name={conv.name} avatarFile={conv.avatar} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm truncate ${conv.unread_count > 0 ? 'font-black text-white' : 'font-bold text-gray-300'}`}>
                          {conv.name}
                        </span>
                        <span className={`text-[10px] uppercase tracking-widest flex-shrink-0 ml-2 ${conv.unread_count > 0 ? 'text-gnYellow font-bold' : 'text-gray-500'}`}>
                          {timeAgo(conv.last_message_at, i18n.language)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-white font-semibold' : 'text-gray-500'}`}>
                          {conv.last_sender_id === user.id ? (i18n.language.startsWith('fr') ? 'Vous: ' : 'You: ') : ''}{conv.last_message}
                        </p>
                        {conv.unread_count > 0 ? (
                          <span className="ml-2 bg-gnYellow text-black font-black text-[10px] rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(252,209,22,0.4)]">
                            {conv.unread_count}
                          </span>
                        ) : (
                          <span className={`ml-2 text-[10px] font-bold uppercase tracking-widest flex-shrink-0 ${
                            conv.last_sender_id === user.id && !conv.last_message_read ? 'text-gray-600' : 'text-gnYellow/70'
                          }`}>
                            {conv.last_sender_id === user.id
                              ? (conv.last_message_read
                                  ? (i18n.language.startsWith('fr') ? 'Lu' : 'Seen')
                                  : (i18n.language.startsWith('fr') ? 'Remis' : 'Deliv'))
                              : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          {showChat ? (
            <div className="flex flex-col flex-1 min-w-0 bg-luxuryDark relative">
              {/* Chat Header */}
              <div className="flex items-center gap-4 p-5 border-b border-white/5 bg-luxuryDark/80 backdrop-blur-md absolute top-0 w-full z-10">
                <button onClick={() => navigate('/messages')} className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors">
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                {otherUser && (
                  <>
                    <Avatar name={otherUser.name} avatarFile={otherUser.avatar} />
                    <Link to={`/profile/${otherUser.id}`} className="font-display font-black text-lg text-white hover:text-gnYellow transition-colors tracking-wide">
                      {otherUser.name}
                    </Link>
                  </>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 pt-28 space-y-6 custom-scrollbar">
                {loadingMsg ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gnYellow"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-12 font-medium bg-white/5 rounded-2xl p-6 mx-auto max-w-sm border border-white/5">
                    {t('messages.start_conversation') || 'Démarrez la conversation...'}
                  </div>
                ) : (
                  (() => {
                    const myMsgs = messages.filter(m => m.sender_id === user.id);
                    const lastMyMsgId = myMsgs.length > 0 ? myMsgs[myMsgs.length - 1].id : null;
                    
                    return messages.map(msg => {
                      const isMe = msg.sender_id === user.id;
                      const showRead = isMe && msg.id === lastMyMsgId && msg.read === 1;
                      
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-3 w-full group`}>
                            {!isMe && <Avatar name={msg.sender_name} avatarFile={msg.sender_avatar} size="sm" />}
                            
                            <div className={`max-w-[75%] px-5 py-3 text-sm shadow-lg ${
                              isMe
                                ? 'bg-gradient-to-br from-gnYellow to-[#D4AF37] text-black rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-sm'
                                : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-sm'
                            }`}>
                              <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                              <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 text-right ${isMe ? 'text-black/60' : 'text-gray-500'}`}>
                                {timeAgo(msg.created_at, i18n.language)}
                              </p>
                            </div>
                          </div>
                          {showRead && (
                            <p className="text-[10px] font-bold text-gnYellow uppercase tracking-widest mt-1 mr-2 opacity-80">
                              {i18n.language.startsWith('fr') ? 'Vu' : 'Seen'} ✓
                            </p>
                          )}
                        </div>
                      );
                    });
                  })()
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-5 border-t border-white/5 bg-luxuryDark/80 backdrop-blur-md">
                <div className="flex gap-3 items-end bg-black/40 p-2 rounded-2xl border border-white/10 focus-within:border-gnYellow/50 transition-colors">
                  <textarea
                    className="flex-1 bg-transparent text-white px-4 py-3 outline-none resize-none text-sm placeholder-gray-500 custom-scrollbar"
                    rows={1}
                    placeholder={t('messages.placeholder') || 'Écrivez votre message...'}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ maxHeight: '120px' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="p-3 mb-1 mr-1 rounded-xl bg-gnYellow text-black hover:bg-white disabled:opacity-50 disabled:hover:bg-gnYellow transition-all shadow-[0_0_15px_rgba(252,209,22,0.2)]"
                  >
                    <PaperAirplaneIcon className="h-5 w-5 -rotate-45 ml-0.5 mb-0.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-col flex-1 items-center justify-center text-gray-500 bg-luxuryDark">
              <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                <ChatBubbleLeftRightIcon className="h-10 w-10 text-gnYellow/50" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest">{t('messages.select_conversation') || 'Sélectionnez une conversation'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}