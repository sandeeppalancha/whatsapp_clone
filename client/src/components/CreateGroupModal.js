// client/src/components/CreateGroupModal.js - Updated to show all users
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { X, Camera, Check, Search } from 'lucide-react';

// Import services
import chatService from '../services/chatService';

// Import Redux actions
import { addConversation } from '../redux/slices/chatSlice';

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

const ModalBody = styled.div`
  padding: 15px;
  overflow-y: auto;
  max-height: calc(90vh - 130px);
`;

const GroupInfoSection = styled.div`
  margin-bottom: 20px;
`;

const GroupAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: ${props => props.theme === 'dark' ? '#333' : '#f0f0f0'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  position: relative;
  cursor: pointer;
  overflow: hidden;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CameraIcon = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: #4caf50;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const InputGroup = styled.div`
  margin-bottom: 15px;
  width: 100%;
  box-sizing: border-box;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
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

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#ddd'};
  background-color: ${props => props.theme === 'dark' ? '#333' : '#fff'};
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  resize: vertical;
  min-height: 70px;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #4caf50;
  }
`;

const ParticipantsSection = styled.div`
  margin-top: 20px;
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 15px;
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
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
`;

const ContactsList = styled.div`
  max-height: 250px;
  overflow-y: auto;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#333' : '#f5f5f5'};
  }
  
  ${props => props.selected && `
    background-color: ${props.theme === 'dark' ? '#2a5885' : '#e3f2fd'};
    
    &:hover {
      background-color: ${props.theme === 'dark' ? '#2a5885' : '#e3f2fd'};
    }
  `}
`;

const ContactAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.theme === 'dark' ? '#444' : '#eee'};
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const ContactInfo = styled.div`
  flex: 1;
`;

const ContactName = styled.div`
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
`;

const ContactStatus = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
`;

const SelectedIndicator = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #4caf50;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const SelectedParticipants = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
`;

const ParticipantChip = styled.div`
  display: flex;
  align-items: center;
  background-color: ${props => props.theme === 'dark' ? '#2a5885' : '#e3f2fd'};
  border-radius: 20px;
  padding: 5px 10px;
  margin-right: 5px;
  margin-bottom: 5px;
`;

const ParticipantName = styled.span`
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  margin-right: 5px;
`;

const RemoveParticipant = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'dark' ? '#ccc' : '#666'};
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${props => props.theme === 'dark' ? '#fff' : '#333'};
  }
`;

const ModalFooter = styled.div`
  padding: 15px;
  border-top: 1px solid ${props => props.theme === 'dark' ? '#333' : '#eee'};
  display: flex;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  
  ${props => props.primary && `
    background-color: #4caf50;
    color: white;
    border: none;
    
    &:hover {
      background-color: #3d9940;
    }
    
    &:disabled {
      background-color: #a5d6a7;
      cursor: not-allowed;
    }
  `}
  
  ${props => props.secondary && `
    background-color: transparent;
    color: ${props.theme === 'dark' ? '#f5f5f5' : '#333'};
    border: 1px solid ${props.theme === 'dark' ? '#444' : '#ddd'};
    margin-right: 10px;
    
    &:hover {
      background-color: ${props.theme === 'dark' ? '#333' : '#f5f5f5'};
    }
  `}
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

const CreateGroupModal = ({ isOpen, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const { theme } = useSelector(state => state.ui);
  const currentUser = useSelector(state => state.auth.user);
  
  const [groupInfo, setGroupInfo] = useState({
    name: '',
    description: '',
    avatar: null
  });
  
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Input ref for file upload
  const fileInputRef = React.useRef(null);
  
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
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGroupInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Preview the image
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    setGroupInfo(prev => ({
      ...prev,
      avatar: file
    }));
  };
  
  const toggleContactSelection = (contact) => {
    if (selectedContacts.some(c => c.id === contact.id)) {
      setSelectedContacts(prev => prev.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts(prev => [...prev, contact]);
    }
  };
  
  const removeSelectedContact = (contactId) => {
    setSelectedContacts(prev => prev.filter(c => c.id !== contactId));
  };
  
  const handleCreateGroup = async () => {
    // Validate form
    if (!groupInfo.name.trim()) {
      alert('Please enter a group name');
      return;
    }
    
    if (selectedContacts.length === 0) {
      alert('Please select at least one contact');
      return;
    }
    
    setIsCreatingGroup(true);
    
    try {
      // Create group data object
      const groupData = {
        name: groupInfo.name.trim(),
        description: groupInfo.description.trim(),
        memberIds: selectedContacts.map(contact => contact.id)
      };
      
      // If there's an avatar, upload it first
      if (groupInfo.avatar) {
        // This would use your uploadAttachment service
        // const uploadResponse = await chatService.uploadAttachment(groupInfo.avatar);
        // groupData.groupPicture = uploadResponse.data.filePath;
      }
      
      // Create the group
      const response = await chatService.createGroup(groupData);
      
      // Success callback
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setIsCreatingGroup(false);
    }
  };
  
  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      setGroupInfo({
        name: '',
        description: '',
        avatar: null
      });
      setSelectedContacts([]);
      setSearchTerm('');
      setAvatarPreview(null);
      setError('');
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <ModalOverlay>
      <ModalContainer theme={theme}>
        <ModalHeader theme={theme}>
          <HeaderTitle theme={theme}>Create New Group</HeaderTitle>
          <CloseButton onClick={onClose} theme={theme}>
            <X size={24} />
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <GroupInfoSection>
            <GroupAvatar theme={theme} onClick={handleAvatarClick}>
              {avatarPreview ? (
                <AvatarImage src={avatarPreview} alt="Group Avatar" />
              ) : (
                <div>G</div>
              )}
              <CameraIcon>
                <Camera size={15} />
              </CameraIcon>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleFileChange}
              />
            </GroupAvatar>
            
            <InputGroup>
              <Label theme={theme}>Group Name*</Label>
              <Input 
                type="text" 
                name="name" 
                value={groupInfo.name} 
                onChange={handleInputChange}
                placeholder="Enter group name"
                theme={theme}
              />
            </InputGroup>
            
            <InputGroup>
              <Label theme={theme}>Description</Label>
              <TextArea 
                name="description" 
                value={groupInfo.description} 
                onChange={handleInputChange}
                placeholder="Group description (optional)"
                theme={theme}
              />
            </InputGroup>
          </GroupInfoSection>
          
          <ParticipantsSection>
            <Label theme={theme}>Add Participants*</Label>
            
            {selectedContacts.length > 0 && (
              <SelectedParticipants>
                {selectedContacts.map(contact => (
                  <ParticipantChip key={contact.id} theme={theme}>
                    <ParticipantName theme={theme}>{contact.username}</ParticipantName>
                    <RemoveParticipant 
                      onClick={() => removeSelectedContact(contact.id)}
                      theme={theme}
                    >
                      <X size={16} />
                    </RemoveParticipant>
                  </ParticipantChip>
                ))}
              </SelectedParticipants>
            )}
            
            <SearchContainer>
              <SearchIconContainer theme={theme}>
                <Search size={18} />
              </SearchIconContainer>
              <SearchInput 
                type="text"
                placeholder="Search users"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                theme={theme}
              />
            </SearchContainer>
            
            <ContactsList>
              {isLoading ? (
                <LoadingIndicator theme={theme}>Loading users...</LoadingIndicator>
              ) : error ? (
                <div style={{ color: 'red', padding: '10px' }}>{error}</div>
              ) : filteredUsers.length === 0 ? (
                <NoResults theme={theme}>
                  {searchTerm ? 'No users found' : 'No users available'}
                </NoResults>
              ) : (
                filteredUsers.map(contact => {
                  const isSelected = selectedContacts.some(c => c.id === contact.id);
                  return (
                    <ContactItem 
                      key={contact.id} 
                      onClick={() => toggleContactSelection(contact)}
                      selected={isSelected}
                      theme={theme}
                    >
                      <ContactAvatar theme={theme}>
                        {contact.profilePicture ? (
                          <AvatarImage src={contact.profilePicture} alt={contact.username} />
                        ) : (
                          contact.username[0].toUpperCase()
                        )}
                      </ContactAvatar>
                      <ContactInfo>
                        <ContactName theme={theme}>{contact.username}</ContactName>
                        <ContactStatus theme={theme}>{contact.status || 'Online'}</ContactStatus>
                      </ContactInfo>
                      {isSelected && (
                        <SelectedIndicator>
                          <Check size={16} />
                        </SelectedIndicator>
                      )}
                    </ContactItem>
                  );
                })
              )}
            </ContactsList>
          </ParticipantsSection>
        </ModalBody>
        
        <ModalFooter theme={theme}>
          <Button 
            secondary 
            onClick={onClose}
            theme={theme}
          >
            Cancel
          </Button>
          <Button 
            primary 
            onClick={handleCreateGroup}
            disabled={!groupInfo.name.trim() || selectedContacts.length === 0 || isCreatingGroup}
          >
            {isCreatingGroup ? 'Creating...' : 'Create Group'}
          </Button>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default CreateGroupModal;