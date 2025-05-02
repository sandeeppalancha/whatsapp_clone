import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

// Import redux actions
import { logout } from '../redux/slices/authSlice';
import { toggleSidebar } from '../redux/slices/uiSlice';

const SidebarContainer = styled.div`
  width: 80px;
  height: 100%;
  background-color: ${props => props.theme === 'dark' ? '#1a1a1a' : '#f0f0f0'};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  border-right: 1px solid ${props => props.theme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
`;

const UserAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: ${props => props.theme === 'dark' ? '#333' : '#ddd'};
  margin-bottom: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const Avatar = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  margin-bottom: 15px;
  cursor: pointer;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#333' : '#e0e0e0'};
  }
`;

const Spacer = styled.div`
  flex: 1;
`;

const Sidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { theme } = useSelector(state => state.ui);
  
  const handleProfileClick = () => {
    navigate('/profile');
  };
  
  const handleHomeClick = () => {
    navigate('/');
  };
  
  const handleNewGroupClick = () => {
    // Open new group dialog
    // This is just a placeholder - you'll need to implement this functionality
    alert('Create new group feature coming soon!');
  };
  
  const handleSettingsClick = () => {
    navigate('/settings');
  };
  
  const handleLogoutClick = () => {
    dispatch(logout());
    navigate('/login');
  };
  
  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };
  
  return (
    <SidebarContainer theme={theme}>
      <UserAvatar onClick={handleProfileClick} theme={theme}>
        {user?.profilePicture ? (
          <Avatar src={user.profilePicture} alt="Profile" />
        ) : (
          user?.username?.[0]?.toUpperCase() || 'U'
        )}
      </UserAvatar>
      
      <IconButton onClick={handleHomeClick} theme={theme}>
        <i className="material-icons">home</i>
      </IconButton>
      
      <IconButton onClick={handleNewGroupClick} theme={theme}>
        <i className="material-icons">group_add</i>
      </IconButton>
      
      <Spacer />
      
      <IconButton onClick={handleSettingsClick} theme={theme}>
        <i className="material-icons">settings</i>
      </IconButton>
      
      <IconButton onClick={handleLogoutClick} theme={theme}>
        <i className="material-icons">exit_to_app</i>
      </IconButton>
      
      <IconButton onClick={handleToggleSidebar} theme={theme}>
        <i className="material-icons">chevron_left</i>
      </IconButton>
    </SidebarContainer>
  );
};

export default Sidebar;