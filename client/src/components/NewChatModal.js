// client/src/components/NewChatModal.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { X, Search } from 'lucide-react';

// Import services
import chatService from '../services/chatService';

const ModalOverlay = styled.div`
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

const ModalContainer = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#fff'};
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#333' : '#eee'};
`;

const HeaderTitle = styled.h2`
  margin: 0;
  flex: 1;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  font-size: 1.2rem;
  font-weight: 500;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  
  &:hover {
    color: ${props => props.theme === 'dark' ? '#fff' : '#333'};
  }
`;

const SearchContainer = styled.div`
  position: relative;
  padding: 15px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#333' : '#eee'};
  width: 100%;
  box-sizing: border-box;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 10px 10px 35px;
  border-radius: 5px;
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#ddd'};
  background-color: ${props => props.theme === 'dark' ? '#333' : '#fff'};
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #4caf50;
  }
`;

const SearchIconContainer = styled.div`
  position: absolute;
  left: 25px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
`;

const UsersList = styled.div`
  overflow-y: auto;
  flex: 1;
  max-height: 60vh;
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  padding: 15px;
  cursor: pointer;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#333' : '#eee'};
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#333' : '#f5f5f5'};
  }
`;

const UserAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: ${props => props.theme === 'dark' ? '#444' : '#eee'};
  margin-right: 15px;
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

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  font-weight: 500;
`;

const UserStatus = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
  margin-top: 3px;
`;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 20px;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
`;

const NoResults = styled.div`
  text-align: center;
  padding: 20px;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
`;

const NewChatModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { theme } = useSelector(state => state.ui);
  const currentUser = useSelector(state => state.auth.user);
  
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Fetch all users
  useEffect(() => {
    if (isOpen) {
      const fetchAllUsers = async () => {
        setIsLoading(true);
        setError('');
        
        try {
          const response = await chatService.getAllUsers();
          // Filter out current user
          const users = response.data.filter(user => user.id !== currentUser?.id);
          setAllUsers(users);
          setFilteredUsers(users);
        } catch (err) {
          console.error('Error fetching users:', err);
          setError('Failed to load users. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchAllUsers();
    }
  }, [isOpen, currentUser]);
  
  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(allUsers);
    } else {
      const filtered = allUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, allUsers]);
  
  const handleContactClick = (contact) => {
    // Navigate to the chat with this contact
    navigate(`/chat/${contact.id}`);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <ModalOverlay>
      <ModalContainer theme={theme}>
        <ModalHeader theme={theme}>
          <HeaderTitle theme={theme}>New Chat</HeaderTitle>
          <CloseButton onClick={onClose} theme={theme}>
            <X size={24} />
          </CloseButton>
        </ModalHeader>
        
        <SearchContainer theme={theme}>
          <SearchIconContainer theme={theme}>
            <Search size={18} />
          </SearchIconContainer>
          <SearchInput 
            type="text"
            placeholder="Search users"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            theme={theme}
            autoFocus
          />
        </SearchContainer>
        
        <UsersList>
          {isLoading ? (
            <LoadingIndicator theme={theme}>Loading users...</LoadingIndicator>
          ) : error ? (
            <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>{error}</div>
          ) : filteredUsers.length === 0 ? (
            <NoResults theme={theme}>
              {searchTerm ? 'No users found' : 'No users available'}
            </NoResults>
          ) : (
            filteredUsers.map(user => (
              <UserItem 
                key={user.id}
                onClick={() => handleContactClick(user)}
                theme={theme}
              >
                <UserAvatar theme={theme}>
                  {user.profilePicture ? (
                    <AvatarImage src={user.profilePicture} alt={user.username} />
                  ) : (
                    user.username[0].toUpperCase()
                  )}
                </UserAvatar>
                <UserInfo>
                  <UserName theme={theme}>{user.username}</UserName>
                  <UserStatus theme={theme}>
                    {user.status || (user.isOnline ? 'Online' : 'Offline')}
                  </UserStatus>
                </UserInfo>
              </UserItem>
            ))
          )}
        </UsersList>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default NewChatModal;