// client/src/components/ConversationList.js - Updated with WhatsApp-like ticks
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Plus, UserPlus, Users, MessageCircle, MoreVertical, Search, Check } from 'lucide-react';

const ListContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#f8f8f8'};
  overflow-y: auto;
`;

const ConversationItem = styled.div`
  padding: 10px 15px; /* Reduced padding to make items more compact */
  display: flex;
  align-items: center;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#2a2a2a' : '#f0f0f0'};
  }
  
  &.active {
    background-color: ${props => props.theme === 'dark' ? '#333' : '#e8e8e8'};
  }
`;

const Avatar = styled.div`
  width: 45px; /* Slightly smaller avatar */
  height: 45px;
  border-radius: 50%;
  background-color: ${props => props.theme === 'dark' ? '#555' : '#ddd'};
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ConversationInfo = styled.div`
  flex: 1;
  min-width: 0; /* Allows text truncation to work properly */
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline; /* This aligns items by their baseline - perfect for text alignment */
  margin-bottom: 3px; /* Reduced margin */
  width: 100%;
`;

const ConversationName = styled.div`
  font-weight: bold;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  padding-right: 15px; /* Space for timestamp */
`;

const Timestamp = styled.div`
  font-size: 0.75em; /* Smaller timestamp */
  color: ${props => props.theme === 'dark' ? '#aaa' : '#777'};
  white-space: nowrap;
`;

const SearchBarContainer = styled.div`
  padding: 8px 12px;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#FFFFFF'};
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background-color: ${props => props.theme === 'dark' ? '#2a2a2a' : '#F0F2F5'};
  border-radius: 18px;
  padding: 0 12px;
  height: 36px;
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  padding: 8px;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  font-size: 0.9rem;
  
  &::placeholder {
    color: ${props => props.theme === 'dark' ? '#aaa' : '#919191'};
  }
`;

const LastMessageContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden;
  position: relative;
`;

const LastMessage = styled.div`
  font-size: 0.85em; /* Slightly smaller text */
  color: ${props => props.theme === 'dark' ? '#aaa' : '#777'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
`;

const MetaInfo = styled.div`
  display: flex;
  justify-content: center;
  margin-left: 5px;
`;

const UnreadBadge = styled.div`
  background-color: #128C7E; /* WhatsApp green */
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7em;
  padding: 0 4px;
`;

const MessageStatus = styled.span`
  display: flex;
  align-items: center;
  margin-right: 4px;
  
  /* Default gray color for ticks */
  color: ${props => props.theme === 'dark' ? '#aaa' : '#8D8D8D'};
  
  /* Blue color for read ticks */
  ${props => props.status === 'read' && `
    color: #4FC3F7;
  `}
`;

const SingleCheckContainer = styled.div`
  position: relative;
  height: 14px;
  width: 14px; /* Single check only needs 14px width */
  display: inline-flex;
  align-items: center;
`;

const DoubleCheckContainer = styled.div`
  position: relative;
  height: 14px;
  width: 16px;
`;

const CheckIcon = styled(Check)`
  position: absolute;
  top: 0;
  left: 0;
  height: 16px;
  width: 16px;
`;

const SecondCheckIcon = styled(Check)`
  position: absolute;
  top: 0;
  left: 3px;
  height: 16px;
  width: 16px;
`;

const LoadingIndicator = styled.div`
  padding: 20px;
  text-align: center;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#777'};
`;

const NoConversations = styled.div`
  padding: 20px;
  text-align: center;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#777'};
`;

const ConversationList = ({ conversations, isLoading, onConversationClick }) => {
  const { theme } = useSelector(state => state.ui);
  const { user } = useSelector(state => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conversation => {
    const name = conversation.isGroup 
      ? conversation.name 
      : conversation.user?.username || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    
    // If same day, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If within a week, show day name
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    if (date > oneWeekAgo) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { day: 'numeric', month: 'numeric' });
  };
  
  // Truncate message
  const truncateMessage = (message, maxLength = 30) => {
    if (!message) return '';
    if (message.length <= maxLength) return message;
    return message.slice(0, maxLength) + '...';
  };
  
  // Get status for styling
  const getStatus = (lastMessage) => {
    if (!lastMessage || !user || lastMessage.senderId !== user.id) {
      return null;
    }
    
    // Try to use status property first if available
    if (lastMessage.status) {
      return lastMessage.status;
    }
    
    // Fall back to isRead and isDelivered properties
    if (lastMessage.isRead) {
      return 'read';
    } else if (lastMessage.isDelivered) {
      return 'delivered';
    } else {
      return 'sent';
    }
  };
  
  // Render status icon
  const renderStatusIcon = (lastMessage) => {
    // Skip if not the sender or no lastMessage
    if (!lastMessage || !user || lastMessage.senderId !== user.id) {
      return null;
    }
    
    const status = getStatus(lastMessage);
    
    // Return different icons based on status
    switch (status) {
      case 'sending':
        return (
          <MessageStatus theme={theme} status={status}>
            🕒
          </MessageStatus>
        );
      case 'sent':
        return (
          <MessageStatus theme={theme} status={status}>
            <SingleCheckContainer>
              <CheckIcon size={14} />
            </SingleCheckContainer>
          </MessageStatus>
        );
      case 'delivered':
        return (
          <MessageStatus theme={theme} status={status}>
            <DoubleCheckContainer>
              <CheckIcon size={14} />
              <SecondCheckIcon size={14} />
            </DoubleCheckContainer>
          </MessageStatus>
        );
      case 'read':
        return (
          <MessageStatus theme={theme} status={status}>
            <DoubleCheckContainer>
              <CheckIcon size={14} />
              <SecondCheckIcon size={14} />
            </DoubleCheckContainer>
          </MessageStatus>
        );
      default:
        return null;
    }
  };
  
  return (
    <ListContainer theme={theme}>
      <SearchBarContainer theme={theme}>
        <SearchBar theme={theme}>
          <Search size={18} color={theme === 'dark' ? '#aaa' : '#919191'} />
          <SearchInput 
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            theme={theme}
          />
        </SearchBar>
      </SearchBarContainer>
      
      {isLoading ? (
        <LoadingIndicator theme={theme}>Loading conversations...</LoadingIndicator>
      ) : filteredConversations.length === 0 ? (
        <NoConversations theme={theme}>
          {searchTerm ? 'No matching conversations found' : 'No conversations yet'}
        </NoConversations>
      ) : (
        filteredConversations.map(conversation => {
          const isGroup = conversation.isGroup;
          const name = isGroup 
            ? conversation.name 
            : conversation.user?.username || 'Unknown';
          const avatar = isGroup 
            ? conversation.groupPicture 
            : conversation.user?.profilePicture;
          const lastMessage = conversation.lastMessage || {};
          const messageText = lastMessage.content || 'No messages yet';
          const timestamp = lastMessage.timestamp || 
                            lastMessage.createdAt || 
                            conversation.createdAt;
          const unreadCount = conversation.unreadCount || 0;
          
          return (
            <ConversationItem 
              key={`${isGroup ? 'group' : 'user'}_${conversation.id}`}
              onClick={() => onConversationClick(conversation)}
              theme={theme}
            >
              <Avatar theme={theme}>
                {avatar ? (
                  <AvatarImage src={avatar} alt={name} />
                ) : (
                  name[0]?.toUpperCase() || '?'
                )}
              </Avatar>
              
              <ConversationInfo>
                <TopRow>
                  <ConversationName theme={theme}>{name}</ConversationName>
                  <Timestamp theme={theme}>{formatTime(timestamp)}</Timestamp>
                </TopRow>
                
                <LastMessageContainer>
                  {/* Only show status icon for outgoing messages */}
                  {lastMessage.senderId === user?.id && renderStatusIcon(lastMessage)}
                  
                  <LastMessage theme={theme}>
                    {truncateMessage(messageText)}
                    {lastMessage.attachments && lastMessage.attachments.length > 0 && 
                      (!lastMessage.content ? ' 📎 Attachment' : ' 📎')}
                  </LastMessage>
                </LastMessageContainer>
              </ConversationInfo>
              
              <MetaInfo>
                {unreadCount > 0 && <UnreadBadge>{unreadCount}</UnreadBadge>}
              </MetaInfo>
            </ConversationItem>
          );
        })
      )}
    </ListContainer>
  );
};

export default ConversationList;