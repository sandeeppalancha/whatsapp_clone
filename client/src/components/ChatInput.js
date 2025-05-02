// client/src/components/ChatInput.js - Improved version
import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { Camera, Mic, Send, Paperclip, Smile } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const InputContainer = styled.div`
  padding: 15px;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#f8f8f8'};
  border-top: 1px solid ${props => props.theme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
  display: flex;
  align-items: center;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 12px 15px;
  border-radius: 25px;
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#ddd'};
  background-color: ${props => props.theme === 'dark' ? '#333' : '#fff'};
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  margin: 0 10px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'dark' ? '#666' : '#ccc'};
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#555'};
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#333' : '#e0e0e0'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AttachmentPreview = styled.div`
  position: relative;
  margin-right: 10px;
  width: 50px;
  height: 50px;
  border-radius: 5px;
  overflow: hidden;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.7);
  }
`;

const ChatInput = ({ onSendMessage, onTyping }) => {
  const { theme } = useSelector(state => state.ui);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const isNative = Capacitor.isNativePlatform();
  
  const fileInputRef = useRef(null);
  
  // Handle message change
  const handleMessageChange = useCallback((e) => {
    setMessage(e.target.value);
    if (onTyping) onTyping();
  }, [onTyping]);
  
  // Handle send message
  const handleSendMessage = useCallback(() => {
    if (message.trim() || attachments.length > 0) {
      if (onSendMessage) onSendMessage(message, attachments);
      setMessage('');
      setAttachments([]);
    }
  }, [message, attachments, onSendMessage]);
  
  // Handle key press (send on Enter)
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);
  
  // Handle attachment selection
  const handleFileSelect = useCallback((e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newAttachments = [...attachments];
    
    // Process each selected file
    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const preview = file.type.startsWith('image/') ? event.target.result : null;
        
        newAttachments.push({
          id: Date.now() + index,
          file,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          preview
        });
        
        // Update state after all files are processed
        if (index === files.length - 1) {
          setAttachments(newAttachments);
        }
      };
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
    
    // Clear the input to allow selecting the same file again
    e.target.value = null;
  }, [attachments]);
  
  // Handle remove attachment
  const handleRemoveAttachment = useCallback((id) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
  }, []);
  
  return (
    <InputContainer theme={theme}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        multiple
      />
      
      <IconButton 
        onClick={() => fileInputRef.current.click()} 
        theme={theme}
      >
        <Paperclip size={24} />
      </IconButton>
      
      <IconButton 
        onClick={() => fileInputRef.current.click()} 
        theme={theme}
      >
        <Camera size={24} />
      </IconButton>
      
      {attachments.map(attachment => (
        <AttachmentPreview key={attachment.id}>
          {attachment.preview ? (
            <PreviewImage src={attachment.preview} alt="Attachment" />
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex',
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: '#f0f0f0',
              color: '#555'
            }}>
              {attachment.fileName.split('.').pop().toUpperCase()}
            </div>
          )}
          <RemoveButton onClick={() => handleRemoveAttachment(attachment.id)}>
            ×
          </RemoveButton>
        </AttachmentPreview>
      ))}
      
      <MessageInput
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={handleMessageChange}
        onKeyPress={handleKeyPress}
        theme={theme}
      />
      
      <IconButton theme={theme}>
        <Smile size={24} />
      </IconButton>
      
      <IconButton theme={theme}>
        <Mic size={24} />
      </IconButton>
      
      <IconButton 
        onClick={handleSendMessage} 
        disabled={!message.trim() && attachments.length === 0}
        theme={theme}
      >
        <Send size={24} />
      </IconButton>
    </InputContainer>
  );
};

export default ChatInput;