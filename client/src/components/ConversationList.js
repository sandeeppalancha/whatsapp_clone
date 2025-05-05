// client/src/components/ConversationList.js
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

const ListContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#f8f8f8'};
  overflow-y: auto;
`;

const SearchBar = styled.div`
  padding: 15px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
  width: 100%;
  box-sizing: border-box;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 15px;
  border-radius: 20px;
  border: 1px solid ${props => props.theme === 'dark' ? '#333' : '#e0e0e0'};
  background-color: ${props => props.theme === 'dark' ? '#333' : '#fff'};
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'dark' ? '#555' : '#ccc'};
  }
`;

const ConversationItem = styled.div`
  padding: 15px;
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
  width: 50px;
  height: 50px;
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
`;

const ConversationName = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
`;

const LastMessage = styled.div`
  font-size: 0.9em;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#777'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
`;

const MetaInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const Timestamp = styled.div`
  font-size: 0.8em;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#777'};
  margin-bottom: 5px;
`;

const UnreadBadge = styled.div`
  background-color: #4caf50;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
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
    return date.toLocaleDateString();
  };
  
  // Truncate message
  const truncateMessage = (message, maxLength = 30) => {
    if (!message) return '';
    if (message.length <= maxLength) return message;
    return message.slice(0, maxLength) + '...';
  };
  
  return (
    <ListContainer theme={theme}>
      <SearchBar theme={theme}>
        <SearchInput 
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          theme={theme}
        />
      </SearchBar>
      
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
          const lastMessage = conversation.lastMessage?.content || 'No messages yet';
          const timestamp = conversation.lastMessage?.timestamp || 
                            conversation.lastMessage?.createdAt || 
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
                <ConversationName theme={theme}>{name}</ConversationName>
                <LastMessage theme={theme}>{truncateMessage(lastMessage)}</LastMessage>
              </ConversationInfo>
              
              <MetaInfo>
                <Timestamp theme={theme}>{formatTime(timestamp)}</Timestamp>
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