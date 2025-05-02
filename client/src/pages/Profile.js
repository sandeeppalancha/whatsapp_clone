// client/src/pages/Profile.js
import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { Camera, Edit2, Save, X } from 'lucide-react';

// Import components
import Sidebar from '../components/Sidebar';

// Import services
import userService from '../services/userService';

const ProfileContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: ${props => props.theme === 'dark' ? '#121212' : '#f5f5f5'};
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 1.8em;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
`;

const ProfileCard = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#ffffff'};
  border-radius: 10px;
  padding: 30px;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
`;

const Avatar = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background-color: ${props => props.theme === 'dark' ? '#333' : '#f0f0f0'};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarUploadButton = styled.button`
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background-color: #4caf50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  
  &:hover {
    background-color: #3e8e41;
  }
`;

const ProfileForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: ${props => props.theme === 'dark' ? '#ccc' : '#666'};
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border-radius: 5px;
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#ddd'};
  background-color: ${props => props.theme === 'dark' ? '#333' : '#fff'};
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'dark' ? '#666' : '#ccc'};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border-radius: 5px;
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#ddd'};
  background-color: ${props => props.theme === 'dark' ? '#333' : '#fff'};
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  resize: vertical;
  min-height: 100px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'dark' ? '#666' : '#ccc'};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  ${props => props.primary && `
    background-color: #4caf50;
    color: white;
    border: none;
    
    &:hover {
      background-color: #3e8e41;
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

const ErrorMessage = styled.div`
  color: #f44336;
  margin-top: 20px;
  text-align: center;
`;

const SuccessMessage = styled.div`
  color: #4caf50;
  margin-top: 20px;
  text-align: center;
`;

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { theme } = useSelector(state => state.ui);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    status: user?.status || 'Hey there! I am using Chat App',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef(null);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      status: user?.status || 'Hey there! I am using Chat App',
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      // This would call your API to update user profile
      // For now, this is a placeholder
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user in redux store
      // This would be handled by a thunk in a real app
      /*
      dispatch(updateUserProfile({
        username: formData.username,
        status: formData.status
      }));
      */
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      setIsLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
      setIsLoading(false);
    }
  };
  
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Check file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF)');
      return;
    }
    
    if (file.size > maxSize) {
      setError('File size should be less than 5MB');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // This would call your API to upload profile picture
      // For now, this is a placeholder
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user in redux store
      // This would be handled by a thunk in a real app
      /*
      dispatch(updateProfilePicture(file));
      */
      
      setSuccess('Profile picture updated successfully');
      setIsLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile picture');
      setIsLoading(false);
    }
  };
  
  return (
    <ProfileContainer>
      <Sidebar />
      
      <ContentContainer theme={theme}>
        <ProfileHeader>
          <Title theme={theme}>My Profile</Title>
        </ProfileHeader>
        
        <ProfileCard theme={theme}>
          <AvatarSection>
            <Avatar theme={theme}>
              {user?.profilePicture ? (
                <AvatarImage src={user.profilePicture} alt="Profile" />
              ) : (
                <span style={{ fontSize: '64px' }}>{user?.username?.[0]?.toUpperCase() || 'U'}</span>
              )}
              <AvatarUploadButton onClick={handleAvatarClick}>
                <Camera size={18} />
              </AvatarUploadButton>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
              />
            </Avatar>
          </AvatarSection>
          
          <ProfileForm onSubmit={handleSubmit}>
            <FormGroup>
              <Label theme={theme}>Username</Label>
              <Input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={!isEditing}
                theme={theme}
              />
            </FormGroup>
            
            <FormGroup>
              <Label theme={theme}>Status</Label>
              <TextArea
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={!isEditing}
                theme={theme}
              />
            </FormGroup>
            
            <ButtonGroup>
              {isEditing ? (
                <>
                  <Button 
                    type="button" 
                    secondary 
                    onClick={handleCancel}
                    theme={theme}
                  >
                    <X size={18} />
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    primary 
                    disabled={isLoading}
                  >
                    <Save size={18} />
                    {isLoading ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <Button 
                  type="button" 
                  primary 
                  onClick={handleEdit}
                >
                  <Edit2 size={18} />
                  Edit Profile
                </Button>
              )}
            </ButtonGroup>
          </ProfileForm>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
        </ProfileCard>
      </ContentContainer>
    </ProfileContainer>
  );
};

export default Profile;