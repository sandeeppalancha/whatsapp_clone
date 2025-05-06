// client/src/components/ChatHeader.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { ArrowLeft, MoreVertical } from 'lucide-react';

const HeaderContainer = styled.div`
  height: 70px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#f8f8f8'};
`;

const BackButton = styled.button`
  background: none;
  border: none;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  margin-right: 10px;
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#333' : '#e0e0e0'};
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.theme === 'dark' ? '#555' : '#ddd'};
  margin-right: 10px;
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

const InfoContainer = styled.div`
  flex: 1;
`;

const NameText = styled.div`
  font-weight: bold;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
`;

const Status = styled.div`
  font-size: 0.8em;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#777'};
`;

const ActionButtons = styled.div`
  display: flex;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-left: 10px;
  cursor: pointer;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#333' : '#e0e0e0'};
  }
`;

const ChatHeader = ({ recipient, isGroup }) => {
  const { theme } = useSelector(state => state.ui);
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate('/');
  };
  
  const name = isGroup ? recipient?.name : recipient?.username;
  const avatar = isGroup ? recipient?.groupPicture : recipient?.profilePicture;
  const status = isGroup 
    ? `${recipient?.members?.length || 0} members` 
    : recipient?.isOnline 
      ? 'Online' 
      : recipient?.lastSeen 
        ? `Last seen ${new Date(recipient.lastSeen).toLocaleString()}` 
        : 'Offline';
  
  return (
    <HeaderContainer theme={theme}>
      <BackButton theme={theme} onClick={handleBack}>
        <ArrowLeft size={24} />
      </BackButton>
      
      <Avatar theme={theme}>
        {avatar ? (
          <AvatarImage src={avatar} alt={name} />
        ) : (
          name?.[0]?.toUpperCase() || '?'
        )}
      </Avatar>
      
      <InfoContainer>
        <NameText theme={theme}>{name || 'Loading...'}</NameText>
        <Status theme={theme}>{status}</Status>
      </InfoContainer>
      
      <ActionButtons>
        <IconButton theme={theme}>
          <MoreVertical size={24} />
        </IconButton>
      </ActionButtons>
    </HeaderContainer>
  );
};

export default ChatHeader;