// client/src/pages/Home.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Plus, UserPlus, Users } from 'lucide-react';

// Import components
import ConversationList from '../components/ConversationList';
import EmptyChat from '../components/EmptyChat';
import CreateGroupModal from '../components/CreateGroupModal';
import NewChatModal from '../components/NewChatModal';

// Import Redux actions
import { fetchConversations, fetchContacts, addConversation } from '../redux/slices/chatSlice';

const HomeContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

// Add a header component for the chats list
const ChatsHeader = styled.div`
  padding: 15px 20px;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#f8f8f8'};
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
  display: flex;
  font-weight: bold;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const HeaderTitle = styled.h1`
  font-size: 1.5rem;
  margin: 0;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#4caf50'};
  font-weight: bold;
`;

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  overflow: hidden;
`;

const FloatingActionButton = styled.button`
  position: fixed;
  bottom: 70px; /* Above bottom nav */
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #4caf50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 100;
  
  &:hover {
    background-color: #3e8e41;
  }
`;

const ActionMenu = styled.div`
  position: absolute;
  bottom: 110px; // Changed from 65px to 70px for more space
  right: 20px; // Added right positioning to align with FAB
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#fff'};
  border-radius: 8px;
  box-shadow: 0px 2px 12px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  width: 180px;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  padding: 12px 15px;
  width: 100%;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#333' : '#f5f5f5'};
  }
  
  svg {
    margin-right: 10px;
  }
`;

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { conversations, isLoading } = useSelector(state => state.chat);
  const { theme } = useSelector(state => state.ui);
  
  const [showMenu, setShowMenu] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  
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
  
  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };
  
  const handleNewChat = () => {
    setShowMenu(false);
    setShowNewChatModal(true);
  };
  
  const handleNewGroup = () => {
    setShowMenu(false);
    setShowCreateGroupModal(true);
  };
  
  const handleGroupCreated = (group) => {
    // Add the newly created group to the conversations list
    dispatch(addConversation({
      id: group.id,
      isGroup: true,
      name: group.name,
      description: group.description,
      groupPicture: group.groupPicture,
      adminId: group.adminId,
      members: group.members,
      createdAt: group.createdAt
    }));
    
    // Navigate to the new group
    navigate(`/group/${group.id}`);
  };
  
  return (
    <HomeContainer>
      <ContentArea>
        {/* Add the new header */}
        <ChatsHeader theme={theme}>
          <HeaderTitle theme={theme}>Chats</HeaderTitle>
        </ChatsHeader>
        
        {/* Conversation list remains the same */}
        <ConversationList 
          conversations={conversations}
          isLoading={isLoading}
          onConversationClick={handleConversationClick}
        />
      </ContentArea>
      
      <FloatingActionButton onClick={toggleMenu}>
        <Plus size={24} />
      </FloatingActionButton>
      
      {showMenu && (
        <ActionMenu theme={theme}>
          <MenuItem onClick={handleNewChat} theme={theme}>
            <UserPlus size={20} />
            New Chat
          </MenuItem>
          <MenuItem onClick={handleNewGroup} theme={theme}>
            <Users size={20} />
            New Group
          </MenuItem>
        </ActionMenu>
      )}
      
      <CreateGroupModal 
        isOpen={showCreateGroupModal} 
        onClose={() => setShowCreateGroupModal(false)}
        onSuccess={handleGroupCreated}
      />

      <NewChatModal 
        isOpen={showNewChatModal} 
        onClose={() => setShowNewChatModal(false)}
      />
    </HomeContainer>
  );
};

export default Home;