// client/src/components/EmptyChat.js
import React from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { MessageSquare } from 'lucide-react';

const EmptyChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.theme === 'dark' ? '#121212' : '#f5f5f5'};
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
`;

const IconContainer = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: ${props => props.theme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`;

const Message = styled.p`
  font-size: 1.2em;
  text-align: center;
  max-width: 400px;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
`;

const EmptyChat = ({ message = 'Select a chat to start messaging' }) => {
  const { theme } = useSelector(state => state.ui);
  
  return (
    <EmptyChatContainer theme={theme}>
      <IconContainer theme={theme}>
        <MessageSquare size={50} color={theme === 'dark' ? '#aaa' : '#666'} />
      </IconContainer>
      <Message theme={theme}>{message}</Message>
    </EmptyChatContainer>
  );
};

export default EmptyChat;