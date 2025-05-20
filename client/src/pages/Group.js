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
import ForwardMessageModal from '../components/ForwardMessageModal';

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

  const [replyTo, setReplyTo] = useState(null);
    const [forwardMessage, setForwardMessage] = useState(null);
    const [showForwardModal, setShowForwardModal] = useState(false);
  
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
  
  const handleSendMessage = useCallback((message, attachments = [], replyToId = null) => {
    console.log("Starting handleSendMessage for group chat");
    
    if (!message.trim() && attachments.length === 0) return;
    
    // Send message through socket first to get the clientMessageId
    const clientMessageId = sendGroupMessage(id, message, attachments, replyToId);
    
    console.log("Sent group message and received clientMessageId:", clientMessageId);
    
    if (!clientMessageId) {
      console.error("❌ Failed to get clientMessageId from sendGroupMessage");
      return;
    }
    
    // Create message object with the same clientMessageId
    const messageObject = {
      clientMessageId: clientMessageId,
      content: message,
      senderId: user?.id,
      attachments,
      timestamp: new Date().toISOString(),
      status: 'sending',
      replyToId: replyToId,
      replyTo: replyTo // Include the full replyTo object for immediate display
    };
    
    console.log("Created group message object with clientMessageId:", messageObject.clientMessageId);
    
    // Add message to local state
    dispatch(addMessage({
      conversationId: id,
      isGroup: true,
      message: messageObject
    }));
    
    // Clear the reply state
    setReplyTo(null);
  }, [dispatch, id, user?.id, replyTo]);
  
  const handleTyping = useCallback(() => {
    // Send typing indicator
    sendTypingIndicator(id, true);
  }, [id]);

   // Handle reply
    const handleReply = useCallback((message) => {
      // For group chats, ensure we have complete sender info
      let senderName = 'Unknown';
      
      // If it's the current user
      if (message.senderId === user?.id) {
        senderName = 'You';
      } 
      // If the message already has a sender object with username
      else if (message.sender && message.sender.username) {
        senderName = message.sender.username;
      } 
      // Try to find the sender in group members
      else if (groupInfo && groupInfo.members) {
        const sender = groupInfo.members.find(m => m.id === message.senderId);
        if (sender) {
          senderName = sender.username;
        }
      }
      
      const replyMessage = {
        ...message,
        sender: message.sender || {
          id: message.senderId,
          username: senderName
        }
      };
      
      setReplyTo(replyMessage);
    }, [user?.id, groupInfo]);
  
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
    </GroupContainer>
  );
};

export default Group;