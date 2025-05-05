// client/src/pages/Settings.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { Moon, Sun, Bell, BellOff, Lock, LogOut, Trash2 } from 'lucide-react';

// Import Redux actions
import { setTheme } from '../redux/slices/uiSlice';
import { logout } from '../redux/slices/authSlice';

const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 20px;
  background-color: ${props => props.theme === 'dark' ? '#121212' : '#f5f5f5'};
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  box-sizing: border-box; // Add this
  overflow-y: auto; // Add scrolling if needed
`;

const SettingsHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 1.8em;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
`;

const SettingsContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box; // Add this
`;

const SettingsSection = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#ffffff'};
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  width: 100%; // Add this
  box-sizing: border-box; // Add this
`;

const SectionTitle = styled.h2`
  font-size: 1.2em;
  margin-bottom: 20px;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 10px;
  }
`;

const SettingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 0;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#333' : '#f0f0f0'};
  width: 100%; // Add this
  box-sizing: border-box; // Add this
  flex-wrap: wrap; // Add this to handle small screens
  
  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const SettingLabel = styled.div`
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
`;

const SettingDescription = styled.div`
  font-size: 0.9em;
  margin-top: 5px;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
`;

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: #4caf50;
  }
  
  &:checked + span:before {
    transform: translateX(26px);
  }
`;

const SwitchSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.theme === 'dark' ? '#555' : '#ccc'};
  transition: 0.4s;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  
  ${props => props.primary && `
    background-color: #4caf50;
    color: white;
    border: none;
    
    &:hover {
      background-color: #3e8e41;
    }
  `}
  
  ${props => props.danger && `
    background-color: #f44336;
    color: white;
    border: none;
    
    &:hover {
      background-color: #d32f2f;
    }
  `}
  
  ${props => props.secondary && `
    background-color: transparent;
    color: ${props.theme === 'dark' ? '#f5f5f5' : '#333'};
    border: 1px solid ${props.theme === 'dark' ? '#666' : '#ddd'};
    
    &:hover {
      background-color: ${props.theme === 'dark' ? '#333' : '#f0f0f0'};
    }
  `}
  
  svg {
    margin-right: 8px;
  }
`;

const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogContent = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#ffffff'};
  padding: 20px;
  border-radius: 10px;
  max-width: 400px;
  width: 100%;
`;

const DialogTitle = styled.h3`
  margin-bottom: 15px;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
`;

const DialogText = styled.p`
  margin-bottom: 20px;
  color: ${props => props.theme === 'dark' ? '#ccc' : '#666'};
`;

const DialogButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const Settings = () => {
  const dispatch = useDispatch();
  const { theme } = useSelector(state => state.ui);
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: '',
    title: '',
    message: ''
  });
  
  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    dispatch(setTheme(newTheme));
  };
  
  const handleNotificationsToggle = () => {
    setNotifications(!notifications);
  };
  
  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled);
  };
  
  const handleLogout = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'logout',
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out?'
    });
  };
  
  const handleDeleteAccount = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      title: 'Delete Account',
      message: 'Are you sure you want to delete your account? This action cannot be undone.'
    });
  };
  
  const handleConfirmDialogAction = () => {
    if (confirmDialog.type === 'logout') {
      dispatch(logout());
    } else if (confirmDialog.type === 'delete') {
      // Implement delete account functionality
      console.log('Delete account');
      
      // Then logout
      dispatch(logout());
    }
    
    setConfirmDialog({
      isOpen: false,
      type: '',
      title: '',
      message: ''
    });
  };
  
  const handleCloseDialog = () => {
    setConfirmDialog({
      isOpen: false,
      type: '',
      title: '',
      message: ''
    });
  };
  
  return (
    <SettingsContainer theme={theme}>
      <SettingsHeader>
        <Title theme={theme}>Settings</Title>
      </SettingsHeader>
      
      <SettingsContent>
        <SettingsSection theme={theme}>
          <SectionTitle theme={theme}>
            {theme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
            Appearance
          </SectionTitle>
          
          <SettingItem theme={theme}>
            <div>
              <SettingLabel theme={theme}>Dark Theme</SettingLabel>
              <SettingDescription theme={theme}>
                Switch between light and dark themes
              </SettingDescription>
            </div>
            <Switch>
              <SwitchInput 
                type="checkbox"
                checked={theme === 'dark'}
                onChange={handleThemeToggle}
              />
              <SwitchSlider theme={theme} />
            </Switch>
          </SettingItem>
        </SettingsSection>
        
        <SettingsSection theme={theme}>
          <SectionTitle theme={theme}>
            <Bell size={22} />
            Notifications
          </SectionTitle>
          
          <SettingItem theme={theme}>
            <div>
              <SettingLabel theme={theme}>Enable Notifications</SettingLabel>
              <SettingDescription theme={theme}>
                Receive notifications for new messages
              </SettingDescription>
            </div>
            <Switch>
              <SwitchInput 
                type="checkbox"
                checked={notifications}
                onChange={handleNotificationsToggle}
              />
              <SwitchSlider theme={theme} />
            </Switch>
          </SettingItem>
          
          <SettingItem theme={theme}>
            <div>
              <SettingLabel theme={theme}>Sound</SettingLabel>
              <SettingDescription theme={theme}>
                Play sounds for incoming messages
              </SettingDescription>
            </div>
            <Switch>
              <SwitchInput 
                type="checkbox"
                checked={soundEnabled}
                onChange={handleSoundToggle}
              />
              <SwitchSlider theme={theme} />
            </Switch>
          </SettingItem>
        </SettingsSection>
        
        <SettingsSection theme={theme}>
          <SectionTitle theme={theme}>
            <Lock size={22} />
            Privacy and Security
          </SectionTitle>
          
          <SettingItem theme={theme}>
            <div>
              <SettingLabel theme={theme}>Two-Factor Authentication</SettingLabel>
              <SettingDescription theme={theme}>
                Add an extra layer of security to your account
              </SettingDescription>
            </div>
            <Button secondary theme={theme}>
              Set up
            </Button>
          </SettingItem>
          
          <SettingItem theme={theme}>
            <div>
              <SettingLabel theme={theme}>Blocked Users</SettingLabel>
              <SettingDescription theme={theme}>
                Manage users you've blocked
              </SettingDescription>
            </div>
            <Button secondary theme={theme}>
              Manage
            </Button>
          </SettingItem>
        </SettingsSection>
        
        <SettingsSection theme={theme}>
          <SectionTitle theme={theme}>
            <LogOut size={22} />
            Account
          </SectionTitle>
          
          <SettingItem theme={theme}>
            <div>
              <SettingLabel theme={theme}>Log Out</SettingLabel>
              <SettingDescription theme={theme}>
                Sign out from your account
              </SettingDescription>
            </div>
            <Button secondary theme={theme} onClick={handleLogout}>
              <LogOut size={18} />
              Log Out
            </Button>
          </SettingItem>
          
          <SettingItem theme={theme}>
            <div>
              <SettingLabel theme={theme}>Delete Account</SettingLabel>
              <SettingDescription theme={theme}>
                Permanently delete your account and all your data
              </SettingDescription>
            </div>
            <Button danger onClick={handleDeleteAccount}>
              <Trash2 size={18} />
              Delete
            </Button>
          </SettingItem>
        </SettingsSection>
      </SettingsContent>
      
      {confirmDialog.isOpen && (
        <DialogOverlay>
          <DialogContent theme={theme}>
            <DialogTitle theme={theme}>{confirmDialog.title}</DialogTitle>
            <DialogText theme={theme}>{confirmDialog.message}</DialogText>
            <DialogButtons>
              <Button 
                secondary 
                theme={theme} 
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button 
                danger={confirmDialog.type === 'delete'}
                primary={confirmDialog.type === 'logout'}
                onClick={handleConfirmDialogAction}
              >
                Confirm
              </Button>
            </DialogButtons>
          </DialogContent>
        </DialogOverlay>
      )}
    </SettingsContainer>
  );
};

export default Settings;