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

// Import Redux actions
import { fetchConversations, fetchContacts, addConversation } from '../redux/slices/chatSlice';

const HomeContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
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
  bottom: 65px;
  right: 0;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#fff'};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
    // This would open a contacts modal to start a new conversation
    setShowMenu(false);
    alert("Feature coming soon: Start a new private chat");
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
      <ConversationList 
        conversations={conversations}
        isLoading={isLoading}
        onConversationClick={handleConversationClick}
      />
      
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
    </HomeContainer>
  );
};

export default Home;