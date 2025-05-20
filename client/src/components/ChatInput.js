// Modified ChatInput.js component
import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { Camera, Mic, Send, Paperclip, Smile, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Camera as CapacitorCamera } from '@capacitor/camera';
import chatService from '../services/chatService';

const InputContainer = styled.div`
  padding: 15px;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#e8e8e8'};
  border-top: 1px solid ${props => props.theme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
  display: flex;
  flex-direction: column;
`;

const AttachmentPreviewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
`;

const AttachmentPreview = styled.div`
  position: relative;
  width: 70px;
  height: 70px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#ddd'};
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

const InputControls = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 12px 15px;
  border-radius: 25px;
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#ddd'};
  background-color: ${props => props.theme === 'dark' ? '#333' : '#fff'};
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  margin: 0 10px;
  font-size: 16px;
  
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

const ReplyContainer = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#333' : '#f0f0f0'};
  border-left: 3px solid #4caf50;
  padding: 8px 12px;
  margin-bottom: 10px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ReplyContent = styled.div`
  flex: 1;
`;

const ReplyHeader = styled.div`
  font-weight: bold;
  color: #4caf50;
  font-size: 0.85em;
  margin-bottom: 2px;
`;

const ReplyText = styled.div`
  color: ${props => props.theme === 'dark' ? '#ccc' : '#666'};
  font-size: 0.85em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: ${props => props.theme === 'dark' ? '#fff' : '#333'};
  }
`;

const ChatInput = ({ onSendMessage, onTyping, replyTo, onClearReply }) => {
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
      console.log("Attachments inside handlesendmessage", attachments);
      
      if (onSendMessage) onSendMessage(message, attachments, replyTo?.id);
      setMessage('');
      setAttachments([]);
      if (onClearReply) onClearReply();
    }
  }, [message, attachments, onSendMessage, replyTo, onClearReply]);
  
  // Handle key press (send on Enter)
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);
  
  // Handle attachment selection from file picker
  const handleFileSelect = useCallback((e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newAttachments = [...attachments];
    
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
    
    e.target.value = null;
  }, [attachments]);

  // Handle camera capture (for mobile)
  const handleCameraCapture = useCallback(async () => {
    if (!isNative) return;
    
    try {
      setIsUploading(true);
      
      // Capture photo using Capacitor Camera API
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: 'base64',
        source: 'CAMERA'
      });
      
      // Create a proper dataUrl from the base64 string
      const dataUrl = `data:image/${image.format};base64,${image.base64String}`;
      
      // Convert dataUrl to blob
      const fetchResponse = await fetch(dataUrl);
      const blob = await fetchResponse.blob();
      
      // Create a proper File object
      const fileName = `photo_${Date.now()}.${image.format}`;
      const fileType = `image/${image.format}`;
      
      const file = new File([blob], fileName, {
        type: fileType,
        lastModified: Date.now()
      });
      
      console.log('Camera capture converted to File:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      // Upload the file using the chatService (same as FileUploadInput)
      const response = await chatService.uploadAttachment(
        file,
        // Progress callback
        (progressEvent) => {
          const percentage = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentage}%`);
        }
      );
      
      console.log("Camera upload response:", response);
      
      // Create attachment object using the server response
      // This matches the format used in FileUploadInput
      const attachmentInfo = {
        id: response.data.id,
        fileName: response.data.fileName,
        fileType: response.data.fileType,
        fileSize: response.data.fileSize,
        filePath: response.data.filePath,
        // Keep the preview for UI display
        preview: dataUrl
      };
      
      // Add to attachments state - now it's in the same format as file uploads
      setAttachments(prev => [...prev, attachmentInfo]);
      setIsUploading(false);
    } catch (error) {
      console.error('Error capturing and uploading image:', error);
      setIsUploading(false);
    }
  }, [isNative]);
  
  // Handle remove attachment
  const handleRemoveAttachment = useCallback((id) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
  }, []);
  
  return (
    <InputContainer theme={theme}>
      {/* Attachment preview area - separate from input controls */}
      {attachments.length > 0 && (
        <AttachmentPreviewContainer>
          {attachments.map(attachment => (
            <AttachmentPreview key={attachment.id} theme={theme}>
              {attachment.preview ? (
                <PreviewImage src={attachment.preview} alt="Attachment" />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0',
                  color: theme === 'dark' ? '#ddd' : '#555'
                }}>
                  {attachment.fileName.split('.').pop().toUpperCase()}
                </div>
              )}
              <RemoveButton onClick={() => handleRemoveAttachment(attachment.id)}>
                <X size={12} />
              </RemoveButton>
            </AttachmentPreview>
          ))}
        </AttachmentPreviewContainer>
      )}

      {replyTo && (
        <ReplyContainer theme={theme}>
          <ReplyContent>
            <ReplyHeader>
              {replyTo.sender?.username || 'Unknown'}
            </ReplyHeader>
            <ReplyText theme={theme}>
              {replyTo.content || '[Attachment]'}
            </ReplyText>
          </ReplyContent>
          <CloseButton onClick={onClearReply} theme={theme}>
            <X size={20} />
          </CloseButton>
        </ReplyContainer>
      )}
      
      {/* Input controls */}
      <InputControls>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          multiple
        />
        
        {/* <IconButton 
          onClick={() => fileInputRef.current.click()}
          theme={theme}
        >
          <Paperclip size={24} />
        </IconButton>
        
        <IconButton 
          onClick={isNative ? handleCameraCapture : () => fileInputRef.current.click()}
          theme={theme}
          disabled={isUploading}
        >
          <Camera size={24} />
        </IconButton> */}
        
        <MessageInput
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={handleMessageChange}
          onKeyPress={handleKeyPress}
          theme={theme}
        />
        
        {/* <IconButton theme={theme}>
          <Smile size={24} />
        </IconButton> */}
        
        {/* <IconButton theme={theme}>
          <Mic size={24} />
        </IconButton> */}
        
        <IconButton 
          onClick={handleSendMessage} 
          disabled={!message.trim() && attachments.length === 0}
          theme={theme}
        >
          <Send size={24} />
        </IconButton>
      </InputControls>
    </InputContainer>
  );
};

export default ChatInput;