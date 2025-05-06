// client/src/pages/Chat.js - Improved version
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

// Import components
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
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const Chat = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { messages, contacts, conversations, isLoading } = useSelector(state => state.chat);
  const [recipient, setRecipient] = useState(null);
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);
  
  // Get message key for this conversation
  const messageKey = `user_${id}`;
  const conversationMessages = messages[messageKey] || [];
  
  // Find recipient without creating infinite loop
  useEffect(() => {
    const findRecipient = async () => {
      // Find the recipient user from contacts or conversations
      const foundContact = contacts.find(contact => contact.id?.toString() === id);
      
      if (foundContact) {
        setRecipient(foundContact);
      } else {
        // Try to find in conversations
        const foundConversation = conversations.find(
          conv => !conv.isGroup && conv.user && conv.user.id?.toString() === id
        );
        
        if (foundConversation) {
          setRecipient(foundConversation.user);
        } else {
          // Fetch user details if not found
          try {
            const response = await chatService.getUserProfile(id);
            setRecipient(response.data);
          } catch (error) {
            console.error('Error fetching user info:', error);
          }
        }
      }
    };
    
    findRecipient();
  }, [id, contacts, conversations]);
  
  // Set active conversation and fetch messages
  useEffect(() => {
    // Set active conversation in Redux
    dispatch(setActiveConversation({
      id: parseInt(id),
      isGroup: false
    }));
    
    // Fetch messages for this conversation
    dispatch(fetchMessages({ 
      conversationId: id, 
      isGroup: false 
    }));
    
    // Reset read status flag when conversation changes
    setHasMarkedAsRead(false);
    
    // Return a cleanup function to clear state when unmounting
    return () => {
      // This ensures we don't have lingering state when switching conversations
    };
  }, [dispatch, id]);
  
  // Handle marking messages as read - separate effect to prevent infinite loop
  useEffect(() => {
    // Only run if we have messages and haven't marked them as read yet
    if (conversationMessages.length > 0 && !hasMarkedAsRead) {
      const unreadMessages = conversationMessages.filter(
        msg => msg.senderId?.toString() === id && !msg.isRead
      );
      
      if (unreadMessages.length > 0) {
        unreadMessages.forEach(msg => {
          if (msg.id) {
            sendReadReceipt(msg.id);
          }
        });
        
        // Set flag to prevent marking as read again until conversation changes
        setHasMarkedAsRead(true);
      }
    }
  }, [id, conversationMessages, hasMarkedAsRead]);
  
  const handleSendMessage = useCallback((message, attachments = []) => {
    console.log("handle send messgae", attachments);
    
    if (!message.trim() && attachments.length === 0) return;
    
    // Generate a unique ID for this message
    const messageId = Math.random().toString(36).substr(2, 9);
    
    // Send message through socket
    sendPrivateMessage(id, message, attachments);
    
    // Add message to local state immediately for UI feedback
    dispatch(addMessage({
      conversationId: id,
      isGroup: false,
      message: {
        clientMessageId: messageId,
        content: message,
        senderId: user?.id,
        attachments,
        timestamp: new Date().toISOString(),
        status: 'sending'
      }
    }));
  }, [dispatch, id, user?.id]);
  
  const handleTyping = useCallback(() => {
    // Send typing indicator
    sendTypingIndicator(id, false);
  }, [id]);
  
  return (
    <ChatContainer>
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
    </ChatContainer>
  );
};

export default Chat;