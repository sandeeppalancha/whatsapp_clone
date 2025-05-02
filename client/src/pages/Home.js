// client/src/pages/Home.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

// Import components
import Sidebar from '../components/Sidebar';
import ConversationList from '../components/ConversationList';
import EmptyChat from '../components/EmptyChat';

// Import Redux actions
import { fetchConversations, fetchContacts } from '../redux/slices/chatSlice';

const HomeContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  height: 100%;
`;

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isSidebarOpen } = useSelector(state => state.ui);
  const { conversations, isLoading } = useSelector(state => state.chat);
  
  useEffect(() => {
    // Fetch conversations and contacts on component mount
    dispatch(fetchConversations());
    dispatch(fetchContacts());
  }, [dispatch]);
  
  const handleConversationClick = (conversation) => {
    const path = conversation.isGroup 
      ? `/group/${conversation.id}` 
      : `/chat/${conversation.id}`;
    navigate(path);
  };
  
  return (
    <HomeContainer>
      {isSidebarOpen && <Sidebar />}
      
      <ContentContainer>
        <ConversationList 
          conversations={conversations}
          isLoading={isLoading}
          onConversationClick={handleConversationClick}
        />
        
        <EmptyChat message="Select a conversation to start chatting" />
      </ContentContainer>
    </HomeContainer>
  );
};

export default Home;