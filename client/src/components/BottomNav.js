// client/src/components/BottomNav.js - Updated with WhatsApp-like styling for selected items
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { User, Settings, MessageCircle, MessageSquareText } from 'lucide-react';

const NavContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 72px;
  background-color: ${props => props.theme === 'dark' ? '#1a1a1a' : '#f8f8f8'};
  border-top: 1px solid ${props => props.theme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  padding-top:10px;
`;

const NavItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  cursor: pointer;
  position: relative;
  color: ${props => 
    props.active 
      ? props.theme === 'dark' ? '#128C7E' : '#383838' 
      : props.theme === 'dark' ? '#aaa' : '#666'
  };
  
  &:hover {
    color: ${props => props.theme === 'dark' ? '#128C7E' : '#383838'};
  }
`;

const IconWrapper = styled.div`
  margin-bottom: 4px;
  position: relative;
  z-index: 2;
`;

const GreenHalo = styled.div`
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 36px;
  border-radius: 36%;
  background-color: rgba(18, 140, 126, 0.2); /* Light green halo with transparency */
  z-index: 1;
  display: ${props => props.active ? 'block' : 'none'};
`;

const Label = styled.div`
  font-size: 12px;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  position: relative;
  z-index: 2;
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
        <GreenHalo active={isActive('/profile')} />
        <IconWrapper>
          {isActive('/profile') 
            ? <User size={24} />  // strokeWidth={2.5} fill="#128C7E" stroke="#128C7E" 
            : <User size={24} />
          }
        </IconWrapper>
        <Label active={isActive('/profile')}>Profile</Label>
      </NavItem>
      
      <NavItem 
        onClick={() => navigate('/')} 
        active={isActive('/')}
        theme={theme}
      >
        <GreenHalo active={isActive('/')} />
        <IconWrapper>
          {isActive('/') 
            ? <MessageSquareText size={24}  />  // strokeWidth={2.5} fill="#128C7E" stroke="#128C7E"
            : <MessageSquareText size={24} />
          }
        </IconWrapper>
        <Label active={isActive('/')}>Chats</Label>
      </NavItem>
      
      <NavItem 
        onClick={() => navigate('/settings')} 
        active={isActive('/settings')}
        theme={theme}
      >
        <GreenHalo active={isActive('/settings')} />
        <IconWrapper>
          {isActive('/settings')
            ? <Settings size={24} /> // strokeWidth={2.5} fill="#128C7E" stroke="#128C7E"
            : <Settings size={24} />
          }
        </IconWrapper>
        <Label active={isActive('/settings')}>Settings</Label>
      </NavItem>
    </NavContainer>
  );
};

export default BottomNav;