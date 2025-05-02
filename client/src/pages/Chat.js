// client/src/pages/Chat.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

// Import components
import Sidebar from '../components/Sidebar';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import ChatInput from '../components/ChatInput';

// Import Redux actions
import { setActiveConversation, addMessage, fetchMessages } from '../redux/slices/chatSlice';

// Import services
import { sendPrivateMessage, sendTypingIndicator, sendReadReceipt } from '../services/socketService';
import chatService from '../services/chatService';

const ChatContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

const ChatContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
`;

const Chat = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { isSidebarOpen } = useSelector(state => state.ui);
  const { user } = useSelector(state => state.auth);
  const { messages, contacts, conversations, isLoading } = useSelector(state => state.chat);
  const [recipient, setRecipient] = useState(null);
  
  // Get message key for this conversation
  const messageKey = `user_${id}`;
  const conversationMessages = messages[messageKey] || [];
  
  useEffect(() => {
    // Find the recipient user from contacts or conversations
    const foundContact = contacts.find(contact => contact.id.toString() === id);
    
    if (foundContact) {
      setRecipient(foundContact);
    } else {
      // Try to find in conversations
      const foundConversation = conversations.find(
        conv => !conv.isGroup && conv.user && conv.user.id.toString() === id
      );
      
      if (foundConversation) {
        setRecipient(foundConversation.user);
      } else {
        // Fetch user details if not found
        const fetchUserInfo = async () => {
          try {
            const response = await chatService.getUserProfile(id);
            setRecipient(response.data);
          } catch (error) {
            console.error('Error fetching user info:', error);
          }
        };
        
        fetchUserInfo();
      }
    }
    
    // Set active conversation
    dispatch(setActiveConversation({
      id: parseInt(id),
      isGroup: false
    }));
    
    // Fetch messages for this conversation
    dispatch(fetchMessages({ 
      conversationId: id, 
      isGroup: false 
    }));
    
    // Mark unread messages as read
    const unreadMessages = conversationMessages.filter(
      msg => msg.senderId.toString() === id && !msg.isRead
    );
    
    if (unreadMessages.length > 0) {
      unreadMessages.forEach(msg => {
        if (msg.id) {
          sendReadReceipt(msg.id);
        }
      });
    }
  }, [dispatch, id, contacts, conversations, conversationMessages]);
  
  const handleSendMessage = (message, attachments = []) => {
    // Send message through socket
    const messageId = sendPrivateMessage(id, message, attachments);
    
    // Add message to local state immediately for UI feedback
    dispatch(addMessage({
      conversationId: id,
      isGroup: false,
      message: {
        clientMessageId: messageId,
        content: message,
        senderId: user.id,
        attachments,
        timestamp: new Date().toISOString(),
        status: 'sending'
      }
    }));
  };
  
  const handleTyping = () => {
    // Send typing indicator
    sendTypingIndicator(id, false);
  };
  
  return (
    <ChatContainer>
      {isSidebarOpen && <Sidebar />}
      
      <ChatContent>
        <ChatHeader 
          recipient={recipient}
          isGroup={false}
        />
        
        <MessageList 
          messages={conversationMessages}
          currentUserId={user?.id}
          isLoading={isLoading}
          isGroup={false}
        />
        
        <ChatInput 
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
        />
      </ChatContent>
    </ChatContainer>
  );
};

export default Chat;