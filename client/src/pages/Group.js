// client/src/pages/Group.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

// Import components
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import ChatInput from '../components/ChatInput';

// Import Redux actions
import { fetchMessages, setActiveConversation, addMessage } from '../redux/slices/chatSlice';

// Import services
import { sendGroupMessage, sendTypingIndicator } from '../services/socketService';
import chatService from '../services/chatService';

const GroupContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const Group = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { messages, conversations, isLoading } = useSelector(state => state.chat);
  const [groupInfo, setGroupInfo] = useState(null);
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);
  
  // Get message key for this group
  const messageKey = `group_${id}`;
  const conversationMessages = messages[messageKey] || [];
  
  // Find group without creating infinite loop
  useEffect(() => {
    const findGroup = async () => {
      // Find the group in conversations
      const foundGroup = conversations.find(conv => conv.isGroup && conv.id.toString() === id);
      if (foundGroup) {
        setGroupInfo(foundGroup);
      } else {
        // Fetch group details if not found in conversations
        try {
          const response = await chatService.getGroup(id);
          setGroupInfo(response.data);
        } catch (error) {
          console.error('Error fetching group info:', error);
        }
      }
    };
    
    findGroup();
  }, [id, conversations]);
  
  // Set active conversation and fetch messages
  useEffect(() => {
    dispatch(setActiveConversation({
      id: parseInt(id),
      isGroup: true
    }));
    
    dispatch(fetchMessages({ 
      conversationId: id, 
      isGroup: true 
    }));
    
    // Reset read status flag when group changes
    setHasMarkedAsRead(false);
  }, [dispatch, id]);
  
  // Handle marking messages as read - separate effect to prevent infinite loop
  useEffect(() => {
    // Only run if we have messages and haven't marked them as read yet
    if (conversationMessages.length > 0 && !hasMarkedAsRead) {
      // Mark messages as read
      try {
        chatService.markGroupMessagesAsRead(id);
        setHasMarkedAsRead(true);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  }, [id, conversationMessages, hasMarkedAsRead]);
  
  const handleSendMessage = useCallback((message, attachments = []) => {
    // Send message through socket
    const messageId = sendGroupMessage(id, message, attachments);
    
    // Add message to local state immediately for UI feedback
    dispatch(addMessage({
      conversationId: id,
      isGroup: true,
      message: {
        id: messageId,
        content: message,
        senderId: user.id,
        attachments,
        timestamp: new Date().toISOString(),
        status: 'sending'
      }
    }));
  }, [dispatch, id, user?.id]);
  
  const handleTyping = useCallback(() => {
    // Send typing indicator
    sendTypingIndicator(id, true);
  }, [id]);
  
  return (
    <GroupContainer>
      <ChatHeader 
        recipient={groupInfo}
        isGroup={true}
      />
      
      <MessageList 
        messages={conversationMessages}
        currentUserId={user?.id}
        isLoading={isLoading}
        isGroup={true}
      />
      
      <ChatInput 
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
      />
    </GroupContainer>
  );
};

export default Group;