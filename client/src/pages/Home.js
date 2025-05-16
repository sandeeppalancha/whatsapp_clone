// client/src/pages/Home.js - Updated for responsive design
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Plus, UserPlus, Users, MessageCircle, MoreVertical, Search, MessageSquarePlus } from 'lucide-react';

// Import components
import ConversationList from '../components/ConversationList';
import EmptyChat from '../components/EmptyChat';
import CreateGroupModal from '../components/CreateGroupModal';
import NewChatModal from '../components/NewChatModal';

// Import Redux actions
import { fetchConversations, fetchContacts, addConversation } from '../redux/slices/chatSlice';

// Check if mobile view based on screen size or platform
const isMobileView = () => {
  return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const HeaderContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#f8f8f8'};
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
`;

const HeaderTitle = styled.h1`
  font-size: 1.5rem;
  margin: 0;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#128c7e'};
  font-weight: bold;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#706b6b'};
  margin-left: 24px;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ContentContainer = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const FloatingActionButton = styled.button`
  position: fixed;
  bottom: ${props => props.isMobile ? '70px' : '20px'};
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background-color: #128c7e;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 100;

  @media (min-width: 768px) {
    right: calc(100% - 350px - 20px); /* 350px is sidebar width, 20px is right padding */
  }
  
  &:hover {
    background-color: #075E54;
  }
`;

const ActionMenu = styled.div`
  position: absolute;
  bottom: ${props => props.isMobile ? '110px' : '60px'};
  right: 20px;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#fff'};
  border-radius: 8px;
  box-shadow: 0px 2px 12px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  width: 180px;

  /* Add this media query */
  @media (min-width: 768px) {
    right: calc(100% - 350px - 20px); /* Align with FAB */
  }
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
  const [mobile, setMobile] = useState(isMobileView());
  
  // Update mobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setMobile(isMobileView());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
  
  const handleMoreOptions = () => {
    // Placeholder for more options menu
    console.log('More options clicked');
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
      <ContentContainer>
        <HeaderContainer theme={theme}>
          <HeaderTitle theme={theme}>Synapse</HeaderTitle>
          <HeaderActions>
            <IconButton theme={theme} onClick={handleMoreOptions}>
              <MoreVertical size={24} />
            </IconButton>
          </HeaderActions>
        </HeaderContainer>
        
        <ConversationList 
          conversations={conversations}
          isLoading={isLoading}
          onConversationClick={handleConversationClick}
        />
      </ContentContainer>
      
      <FloatingActionButton onClick={toggleMenu} isMobile={mobile}>
        <MessageSquarePlus size={24} />
      </FloatingActionButton>
      
      {showMenu && (
        <ActionMenu theme={theme} isMobile={mobile}>
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