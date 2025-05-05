// client/src/components/ChatInput.js - Enhanced with file support
import React, { useState, useRef, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { Camera, Mic, Send, Paperclip, Smile, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import FileUploadInput from './FileUploadInput';

const InputContainer = styled.div`
  padding: 15px;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#f8f8f8'};
  border-top: 1px solid ${props => props.theme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
  display: flex;
  flex-direction: column;
`;

const InputRow = styled.div`
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
  margin: 5px;
  padding: 8px;
  background-color: ${props => props.theme === 'dark' ? '#333' : '#f0f0f0'};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const AttachmentName = styled.div`
  font-size: 0.9em;
  margin-left: 8px;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AttachmentSize = styled.div`
  font-size: 0.8em;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#777'};
  margin: 0 8px;
`;

const RemoveButton = styled.button`
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

const ChatInput = ({ onSendMessage, onTyping }) => {
  const { theme } = useSelector(state => state.ui);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const isNative = Capacitor.isNativePlatform();
  
  const fileUploadRef = useRef(null);
  
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
  
  // Upload pending attachments before sending
  useEffect(() => {
    if (fileUploadRef.current && fileUploadRef.current.hasSelectedFiles) {
      fileUploadRef.current.uploadAllFiles();
    }
  }, []);
  
  // Handle file selection from FileUploadInput
  const handleFileSelected = useCallback((attachment) => {
    setAttachments(prev => [...prev, attachment]);
  }, []);
  
  // Handle remove attachment
  const handleRemoveAttachment = useCallback((id) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
  }, []);
  
  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  return (
    <InputContainer theme={theme}>
      <FileUploadInput 
        ref={fileUploadRef}
        onFileSelected={handleFileSelected}
        theme={theme}
      />
      
      {attachments.length > 0 && (
        <div>
          {attachments.map(attachment => (
            <AttachmentPreview key={attachment.id} theme={theme}>
              <AttachmentName theme={theme}>{attachment.fileName}</AttachmentName>
              <AttachmentSize theme={theme}>{formatFileSize(attachment.fileSize)}</AttachmentSize>
              <RemoveButton 
                theme={theme}
                onClick={() => handleRemoveAttachment(attachment.id)}
              >
                <X size={18} />
              </RemoveButton>
            </AttachmentPreview>
          ))}
        </div>
      )}
      
      <InputRow>
        <IconButton 
          onClick={() => fileUploadRef.current?.openFileSelector()} 
          theme={theme}
        >
          <Paperclip size={24} />
        </IconButton>
        
        <IconButton 
          onClick={() => fileUploadRef.current?.openFileSelector()} 
          theme={theme}
        >
          <Camera size={24} />
        </IconButton>
        
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
      </InputRow>
    </InputContainer>
  );
};

export default ChatInput;