// client/src/pages/Chat.js - Improved version
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

// Import components
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import ChatInput from '../components/ChatInput';
import ForwardMessageModal from '../components/ForwardMessageModal';

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

  const [replyTo, setReplyTo] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  
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
  
  const handleSendMessage = useCallback((message, attachments = [], replyToId = null) => {
    console.log("Starting handleSendMessage");
    
    if (!message.trim() && attachments.length === 0) return;
    
    // Send message through socket first to get the clientMessageId
    const clientMessageId = sendPrivateMessage(id, message, attachments, replyToId);
    
    console.log("Sent message and received clientMessageId:", clientMessageId);
    
    if (!clientMessageId) {
      console.error("❌ Failed to get clientMessageId from sendPrivateMessage");
      return; // Don't proceed if we couldn't get an ID
    }
    
    // Create message object with the same clientMessageId
    const messageObject = {
      clientMessageId: clientMessageId, // Use the SAME ID that was sent to the server
      content: message,
      senderId: user?.id,
      attachments,
      timestamp: new Date().toISOString(),
      status: 'sending',  // Initial status
      replyToId: replyToId
    };
    
    console.log("Created message object with clientMessageId:", messageObject.clientMessageId);
    
    // Add message to local state
    dispatch(addMessage({
      conversationId: id,
      isGroup: false,
      message: messageObject
    }));
    
    // Debug check to verify the message was added with the correct ID
    setTimeout(() => {
      const state = window.store?.getState();
      if (!state) {
        console.error("Could not access Redux store");
        return;
      }
      
      const messageKey = `user_${id}`;
      const messages = state.chat.messages[messageKey] || [];
      
      const addedMessage = messages.find(msg => msg.clientMessageId === clientMessageId);
      if (addedMessage) {
        console.log("✅ Message successfully added to Redux with clientMessageId:", addedMessage.clientMessageId);
        console.log("Message status:", addedMessage.status);
      } else {
        console.error("❌ Message not found in Redux after adding");
        console.log("Available client message IDs:", messages.map(m => m.clientMessageId));
      }
    }, 100);
    
  }, [dispatch, id, user?.id]);
  
  const handleTyping = useCallback(() => {
    // Send typing indicator
    sendTypingIndicator(id, false);
  }, [id]);

  // Handle reply
  const handleReply = useCallback((message) => {
    setReplyTo(message);
  }, []);

  // Handle forward
  const handleForward = useCallback((message) => {
    setForwardMessage(message);
    setShowForwardModal(true);
  }, []);

  // Clear reply
  const handleClearReply = useCallback(() => {
    setReplyTo(null);
  }, []);
  
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
        onReply={handleReply}    // Add this
        onForward={handleForward} // Add this
      />
      
      <ChatInput 
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        replyTo={replyTo}           // Add this
        onClearReply={handleClearReply} // Add this
      />
      <ForwardMessageModal
        isOpen={showForwardModal}
        onClose={() => {
          setShowForwardModal(false);
          setForwardMessage(null);
        }}
        message={forwardMessage}
      />
    </ChatContainer>
  );
};

export default Chat;