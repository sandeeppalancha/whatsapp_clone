// client/src/components/ForwardMessageModal.js
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { X, Search, Send } from 'lucide-react';
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
  max-height: 80vh;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
  cursor: pointer;
  padding: 5px;
  
  &:hover {
    color: ${props => props.theme === 'dark' ? '#fff' : '#333'};
  }
`;

const MessagePreview = styled.div`
  padding: 15px;
  background-color: ${props => props.theme === 'dark' ? '#333' : '#f8f8f8'};
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#444' : '#eee'};
`;

const PreviewHeader = styled.div`
  font-size: 0.85em;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
  margin-bottom: 5px;
`;

const PreviewContent = styled.div`
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
`;

const SearchContainer = styled.div`
  padding: 10px 15px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#333' : '#eee'};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 10px 10px 35px;
  border-radius: 20px;
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#ddd'};
  background-color: ${props => props.theme === 'dark' ? '#333' : '#fff'};
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  position: relative;
  
  &:focus {
    outline: none;
    border-color: #4caf50;
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 25px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
  pointer-events: none;
`;

const ContactsList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 15px;
  cursor: pointer;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#333' : '#f0f0f0'};
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#333' : '#f5f5f5'};
  }
  
  ${props => props.selected && `
    background-color: ${props.theme === 'dark' ? '#2a5885' : '#e3f2fd'};
  `}
`;

const Avatar = styled.div`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background-color: ${props => props.theme === 'dark' ? '#444' : '#ddd'};
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

const ContactInfo = styled.div`
  flex: 1;
`;

const ContactName = styled.div`
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  font-weight: 500;
`;

const ContactType = styled.div`
  font-size: 0.85em;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
`;

const SelectedCount = styled.div`
  padding: 15px;
  text-align: center;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#333' : '#eee'};
`;

const ForwardButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #128c7e;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
  
  &:hover {
    background-color: #075E54;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const NoConversations = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
`;

const ForwardMessageModal = ({ isOpen, onClose, message }) => {
  const { theme } = useSelector(state => state.ui);
  const { conversations } = useSelector(state => state.chat);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [isForwarding, setIsForwarding] = useState(false);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedRecipients([]);
      setIsForwarding(false);
    }
  }, [isOpen]);
  
  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    const name = conv.isGroup ? conv.name : conv.user?.username;
    return name?.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  const toggleRecipient = (recipient) => {
    setSelectedRecipients(prev => {
      const exists = prev.some(r => 
        r.id === recipient.id && r.isGroup === recipient.isGroup
      );
      
      if (exists) {
        return prev.filter(r => 
          !(r.id === recipient.id && r.isGroup === recipient.isGroup)
        );
      } else {
        return [...prev, recipient];
      }
    });
  };
  
  const handleForward = async () => {
    if (selectedRecipients.length === 0 || !message) return;
    
    setIsForwarding(true);
    
    try {
      // Forward message to each selected recipient
      for (const recipient of selectedRecipients) {
        await chatService.forwardMessage({
          messageId: message.id,
          to: recipient.id,
          isGroup: recipient.isGroup
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error forwarding message:', error);
      alert('Failed to forward message');
    } finally {
      setIsForwarding(false);
    }
  };
  
  if (!isOpen || !message) return null;
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer theme={theme} onClick={e => e.stopPropagation()}>
        <ModalHeader theme={theme}>
          <HeaderTitle theme={theme}>Forward Message</HeaderTitle>
          <CloseButton onClick={onClose} theme={theme}>
            <X size={24} />
          </CloseButton>
        </ModalHeader>
        
        <MessagePreview theme={theme}>
          <PreviewHeader theme={theme}>Forwarding:</PreviewHeader>
          <PreviewContent theme={theme}>
            {message.content || '[Attachment]'}
          </PreviewContent>
        </MessagePreview>
        
        {selectedRecipients.length > 0 && (
          <SelectedCount theme={theme}>
            {selectedRecipients.length} recipient(s) selected
          </SelectedCount>
        )}
        
        <SearchContainer theme={theme}>
          <div style={{ position: 'relative' }}>
            <SearchIcon size={18} theme={theme} />
            <SearchInput
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              theme={theme}
            />
          </div>
        </SearchContainer>
        
        <ContactsList>
          {filteredConversations.length === 0 ? (
            <NoConversations theme={theme}>
              {searchTerm ? 'No results found' : 'No conversations available'}
            </NoConversations>
          ) : (
            filteredConversations.map(conv => {
              const isSelected = selectedRecipients.some(r => 
                r.id === conv.id && r.isGroup === conv.isGroup
              );
              
              return (
                <ContactItem
                  key={`${conv.isGroup ? 'group' : 'user'}_${conv.id}`}
                  onClick={() => toggleRecipient(conv)}
                  selected={isSelected}
                  theme={theme}
                >
                  <Avatar theme={theme}>
                    {conv.isGroup ? (
                      conv.groupPicture ? (
                        <AvatarImage src={conv.groupPicture} alt={conv.name} />
                      ) : (
                        conv.name?.[0]?.toUpperCase() || 'G'
                      )
                    ) : (
                      conv.user?.profilePicture ? (
                        <AvatarImage src={conv.user.profilePicture} alt={conv.user.username} />
                      ) : (
                        conv.user?.username?.[0]?.toUpperCase() || 'U'
                      )
                    )}
                  </Avatar>
                  <ContactInfo>
                    <ContactName theme={theme}>
                      {conv.isGroup ? conv.name : conv.user?.username}
                    </ContactName>
                    <ContactType theme={theme}>
                      {conv.isGroup ? 'Group' : 'Private Chat'}
                    </ContactType>
                  </ContactInfo>
                </ContactItem>
              );
            })
          )}
        </ContactsList>
        
        {selectedRecipients.length > 0 && (
          <ForwardButton
            onClick={handleForward}
            disabled={isForwarding}
          >
            {isForwarding ? (
              <div>...</div>
            ) : (
              <Send size={24} />
            )}
          </ForwardButton>
        )}
      </ModalContainer>
    </ModalOverlay>
  );
};

export default ForwardMessageModal;