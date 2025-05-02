// client/src/components/BottomNav.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { User, MessageSquare, Settings } from 'lucide-react';

const NavContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: ${props => props.theme === 'dark' ? '#1a1a1a' : '#f8f8f8'};
  border-top: 1px solid ${props => props.theme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
`;

const NavItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  cursor: pointer;
  color: ${props => 
    props.active 
      ? props.theme === 'dark' ? '#4caf50' : '#4caf50' 
      : props.theme === 'dark' ? '#aaa' : '#666'
  };
  
  &:hover {
    color: ${props => props.theme === 'dark' ? '#4caf50' : '#4caf50'};
  }
`;

const IconWrapper = styled.div`
  margin-bottom: 4px;
`;

const Label = styled.div`
  font-size: 12px;
`;

const BottomNav = ({ theme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname.startsWith('/chat') || location.pathname.startsWith('/group');
    }
    return location.pathname === path;
  };
  
  return (
    <NavContainer theme={theme}>
      <NavItem 
        onClick={() => navigate('/profile')} 
        active={isActive('/profile')}
        theme={theme}
      >
        <IconWrapper>
          <User size={24} />
        </IconWrapper>
        <Label>Profile</Label>
      </NavItem>
      
      <NavItem 
        onClick={() => navigate('/')} 
        active={isActive('/')}
        theme={theme}
      >
        <IconWrapper>
          <MessageSquare size={24} />
        </IconWrapper>
        <Label>Chats</Label>
      </NavItem>
      
      <NavItem 
        onClick={() => navigate('/settings')} 
        active={isActive('/settings')}
        theme={theme}
      >
        <IconWrapper>
          <Settings size={24} />
        </IconWrapper>
        <Label>Settings</Label>
      </NavItem>
    </NavContainer>
  );
};

export default BottomNav;