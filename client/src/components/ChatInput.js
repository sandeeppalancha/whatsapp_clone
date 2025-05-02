// client/src/components/ChatInput.js
import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { Camera, Mic, Send, Paperclip, Smile } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Camera as CapacitorCamera } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';

// Import services
import chatService from '../services/chatService';

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

  const fileInput = useRef(null);
  
  // Handle message change
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    onTyping();
  };
  
  // Handle send message
  const handleSendMessage = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message, attachments);
      setMessage('');
      setAttachments([]);
    }
  };
  
  // Handle key press (send on Enter)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle file selection
  const handleFileSelect = async (e) => {
    if (isNative) {
      // Using Capacitor Camera API for native platforms
      try {
        const image = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: 'uri'
        });
        
        // Convert to base64 for preview
        const base64Data = await Filesystem.readFile({
          path: image.path
        });
        
        // Create a file object for upload
        const fileName = `image_${Date.now()}.${image.format}`;
        const newFile = {
          id: Date.now().toString(),
          file: base64Data.data,
          fileName,
          fileType: `image/${image.format}`,
          preview: `data:image/${image.format};base64,${base64Data.data}`
        };
        
        setAttachments([...attachments, newFile]);
      } catch (error) {
        console.error('Error selecting image:', error);
      }
    } else {
      // Web file input
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      const newAttachments = [...attachments];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = (e) => {
          newAttachments.push({
            id: Date.now() + i,
            file,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            preview: file.type.startsWith('image/') ? e.target.result : null
          });
          
          if (i === files.length - 1) {
            setAttachments(newAttachments);
          }
        };
        
        if (file.type.startsWith('image/')) {
          reader.readAsDataURL(file);
        } else {
          reader.readAsArrayBuffer(file);
          newAttachments.push({
            id: Date.now() + i,
            file,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            preview: null
          });
        }
      }
    }
  };
  
  // Handle attachment upload
  const handleAttachmentUpload = async () => {
    if (attachments.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const uploadPromises = attachments.map(attachment => {
        return chatService.uploadAttachment(attachment.file, (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${progress}%`);
        });
      });
      
      const results = await Promise.all(uploadPromises);
      
      // Process uploaded attachments
      const uploadedAttachments = results.map((result, index) => ({
        ...attachments[index],
        filePath: result.data.filePath
      }));
      
      setAttachments(uploadedAttachments);
      setIsUploading(false);
    } catch (error) {
      console.error('Error uploading attachments:', error);
      setIsUploading(false);
    }
  };
  
  // Handle remove attachment
  const handleRemoveAttachment = (id) => {
    setAttachments(attachments.filter(attachment => attachment.id !== id));
  };
  
  // Handle camera click
  const handleCameraClick = async () => {
    if (isNative) {
      try {
        const image = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: 'uri'
        });
        
        // Process the image similar to handleFileSelect
        // ...
      } catch (error) {
        console.error('Error taking photo:', error);
      }
    } else {
      // Trigger file input for web
      fileInput.current.click();
    }
  };
  
  return (
    <InputContainer theme={theme}>
      <input
        type="file"
        ref={fileInput}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        multiple
      />
      
      <IconButton onClick={() => fileInput.current.click()} theme={theme}>
        <Paperclip size={24} />
      </IconButton>
      
      <IconButton onClick={handleCameraClick} theme={theme}>
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
            &times;
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