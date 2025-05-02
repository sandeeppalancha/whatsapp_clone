// client/src/pages/Group.js
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
import { fetchMessages, setActiveConversation, addMessage } from '../redux/slices/chatSlice';

// Import services
import { sendGroupMessage, sendTypingIndicator } from '../services/socketService';
import chatService from '../services/chatService';

const GroupContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

const GroupContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
`;

const Group = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { isSidebarOpen } = useSelector(state => state.ui);
  const { user } = useSelector(state => state.auth);
  const { messages, conversations, isLoading } = useSelector(state => state.chat);
  const [groupInfo, setGroupInfo] = useState(null);
  
  // Get message key for this group
  const messageKey = `group_${id}`;
  const conversationMessages = messages[messageKey] || [];
  
  useEffect(() => {
    // Find the group in conversations
    const foundGroup = conversations.find(conv => conv.isGroup && conv.id.toString() === id);
    if (foundGroup) {
      setGroupInfo(foundGroup);
    } else {
      // Fetch group details if not found in conversations
      const fetchGroupInfo = async () => {
        try {
          const response = await chatService.getGroup(id);
          setGroupInfo(response.data);
        } catch (error) {
          console.error('Error fetching group info:', error);
        }
      };
      
      fetchGroupInfo();
    }
    
    // Set active conversation
    dispatch(setActiveConversation({
      id: parseInt(id),
      isGroup: true
    }));
    
    // Fetch messages for this group
    dispatch(fetchMessages({ conversationId: id, isGroup: true }));
    
    // Mark messages as read when entering the group
    if (conversationMessages.length > 0) {
      chatService.markGroupMessagesAsRead(id);
    }
  }, [dispatch, id, conversations, conversationMessages.length]);
  
  const handleSendMessage = (message, attachments = []) => {
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
  };
  
  const handleTyping = () => {
    // Send typing indicator
    sendTypingIndicator(id, true);
  };
  
  return (
    <GroupContainer>
      {isSidebarOpen && <Sidebar />}
      
      <GroupContent>
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
      </GroupContent>
    </GroupContainer>
  );
};

export default Group;