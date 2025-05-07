// client/src/components/MessageList.js - Complete fixed version
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import ImagePreview from './ImagePreview';

const ListContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  // background-color: ${props => props.theme === 'dark' ? '#121212' : '#f5f5f5'};
  background-color: ${props => props.theme === 'dark' ? '#121212' : '#ece5dda1'};
  display: flex;
  flex-direction: column;
  height: 0; /* Add this to ensure flex growing works */
`;

const MessageGroup = styled.div`
  margin-bottom: 20px;
`;

const MessageDate = styled.div`
  text-align: center;
  margin: 16px auto;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#777'};
  font-size: 0.9em;
  background: #f5f5f5;
  padding: 8px 10px;
  width: fit-content;
  border-radius: 10px;
  font-weight: 500;
`;

const MessageBubble = styled.div`
  max-width: 70%;
  width: fit-content;
  padding: 12px 15px;
  border-radius: 18px;
  margin-bottom: 10px;
  position: relative;
  word-wrap: break-word;
  padding-bottom: 15px; /* Make room for timestamp */
  
  ${props => props.isSent ? `
    // background-color: ${props.theme === 'dark' ? '#2a5885' : '#e3f2fd'};
    background-color: ${props.theme === 'dark' ? '#2a5885' : 'rgb(217, 253, 211)'};
    color: ${props.theme === 'dark' ? '#fff' : '#333'};
    border-bottom-right-radius: 5px;
    margin-left: auto;
  ` : `
    background-color: ${props.theme === 'dark' ? '#333' : '#fff'};
    color: ${props.theme === 'dark' ? '#f5f5f5' : '#333'};
    border-bottom-left-radius: 5px;
    margin-right: auto;
  `}
`;

const SenderName = styled.div`
  font-size: 0.8em;
  margin-bottom: 5px;
  font-weight: bold;
  color: #4caf50;
`;

const ImagewPreview = styled.img`
  max-width: 200px;
  max-height: 200px;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const MessageContent = styled.div`
  margin-right: 60px; /* Space for timestamp */
`;

const MessageTime = styled.div`
  font-size: 0.7em;
  color: ${props => props.theme === 'dark' ? '#ccc' : '#999'};
  position: absolute;
  bottom: 5px;
  right: 10px;
`;

const MessageStatus = styled.span`
  font-size: 0.7em;
  color: ${props => props.theme === 'dark' ? '#ccc' : '#999'};
  margin-left: 5px;
  
  ${props => props.status === 'sent' && `
    color: #8BC34A;
  `}
  
  ${props => props.status === 'delivered' && `
    color: #2196F3;
  `}
  
  ${props => props.status === 'read' && `
    color: #9C27B0;
  `}
`;

const AttachmentPreview = styled.div`
  margin-top: 8px;
  max-width: 200px;
`;

const Image = styled.img`
  max-width: 200px;
  max-height: 200px;
  border-radius: 10px;
  cursor: pointer;
`;

const Document = styled.div`
  display: flex;
  align-items: center;
  background-color: ${props => props.theme === 'dark' ? '#444' : '#f0f0f0'};
  padding: 10px;
  border-radius: 5px;
  margin-top: 5px;
  cursor: pointer;
`;

const DocumentIcon = styled.div`
  margin-right: 10px;
  color: ${props => props.theme === 'dark' ? '#ccc' : '#666'};
`;

const DocumentInfo = styled.div`
  flex: 1;
`;

const DocumentName = styled.div`
  font-size: 0.9em;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
`;

const DocumentSize = styled.div`
  font-size: 0.8em;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#777'};
`;

const LoadingIndicator = styled.div`
  text-align: center;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#777'};
  padding: 20px;
`;

const NoMessages = styled.div`
  text-align: center;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#777'};
  padding: 20px;
`;

const MessageList = ({ messages, currentUserId, isLoading, isGroup }) => {
  const { theme } = useSelector(state => state.ui);
  const messagesEndRef = useRef(null);
  const [processedMessages, setProcessedMessages] = useState([]);

  // const [previewImage, setPreviewImage] = useState(null);
  const [previewImages, setPreviewImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  
  // Process and sort messages when the messages prop changes
  useEffect(() => {
    if (!messages || messages.length === 0) {
      setProcessedMessages([]);
      return;
    }
    
    // Clone and sort messages by timestamp
    const sorted = [...messages].sort((a, b) => {
      const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
      const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
      return timeA - timeB; // Ascending order (oldest first, newest last)
    });
    
    setProcessedMessages(sorted);
  }, [messages]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [processedMessages]);
  
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const collectImageAttachments = () => {
    const images = [];
    
    if (!processedMessages || processedMessages.length === 0) return images;
    
    processedMessages.forEach(message => {
      if (message.attachments && Array.isArray(message.attachments)) {
        message.attachments.forEach(attachment => {
          if (attachment.fileName && /\.(jpeg|jpg|gif|png)$/i.test(attachment.fileName)) {
            images.push({
              src: attachment.filePath,
              name: attachment.fileName,
              messageId: message.id
            });
          }
        });
      }
    });
    
    return images;
  };
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown Date';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }
    
    // If yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise show full date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = {};
    
    processedMessages.forEach(message => {
      const timestamp = message.timestamp || message.createdAt;
      if (!timestamp) return; // Skip messages without timestamp
      
      const date = new Date(timestamp).toDateString();
      
      if (!groups[date]) {
        groups[date] = [];
      }
      
      groups[date].push(message);
    });
    
    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages
    }));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderAttachment = (attachment) => {
    if (!attachment) return null;
    
    // Determine the type of attachment based on fileType
    const isImage = attachment.fileType && /\.(jpeg|jpg|gif|png)$/i.test(attachment.fileName) 
      || attachment.fileType.startsWith('image/');
    
    const isVideo = attachment.fileType && /\.(mp4|webm|ogg|mov)$/i.test(attachment.fileName)
      || attachment.fileType.startsWith('video/');
    
    const isAudio = attachment.fileType && /\.(mp3|wav|ogg)$/i.test(attachment.fileName)
      || attachment.fileType.startsWith('audio/');
    
    const isDocument = !isImage && !isVideo && !isAudio;    

    if (isImage) {
      // Get all images for preview
      const allImages = collectImageAttachments();
      // Find index of this image in all images
      const imageIndex = allImages.findIndex(
        img => img.src === attachment.filePath
      );
      
      return (
        <AttachmentPreview key={attachment.id}>
          <Image 
            src={attachment.filePath} 
            alt={attachment.fileName} 
            onClick={() => {
              setPreviewImages(allImages);
              setPreviewIndex(imageIndex);
              setShowPreview(true);
            }}
          />
        </AttachmentPreview>
      );
    } else if (isVideo) {
      return (
        <AttachmentPreview key={attachment.id}>
          <video 
            controls
            width="200"
            height="auto"
            src={attachment.filePath}
          >
            Your browser does not support the video tag.
          </video>
        </AttachmentPreview>
      );
    } else if (isAudio) {
      return (
        <AttachmentPreview key={attachment.id}>
          <audio 
            controls
            src={attachment.filePath}
          >
            Your browser does not support the audio tag.
          </audio>
        </AttachmentPreview>
      );
    } else {
      // For documents
      return (
        <AttachmentPreview key={attachment.id}>
          <Document 
            theme={theme}
            onClick={() => window.open(attachment.filePath, '_blank')}
          >
            <DocumentIcon theme={theme}>
              <i className="material-icons">insert_drive_file</i>
            </DocumentIcon>
            <DocumentInfo>
              <DocumentName theme={theme}>{attachment.fileName}</DocumentName>
              <DocumentSize theme={theme}>
                {formatFileSize(attachment.fileSize)}
              </DocumentSize>
            </DocumentInfo>
          </Document>
        </AttachmentPreview>
      );
    }
  };
  
  // Render attachment preview
  // const renderAttachment = (attachment) => {
  //   if (!attachment) return null;
    
  //   const isImage = attachment.fileName && /\.(jpeg|jpg|gif|png)$/i.test(attachment.fileName);
    
  //   if (isImage) {
  //     return (
  //       <AttachmentPreview key={attachment.id}>
  //         <Image 
  //           src={attachment.filePath} 
  //           alt={attachment.fileName} 
  //           onClick={() => window.open(attachment.filePath, '_blank')}
  //         />
  //       </AttachmentPreview>
  //     );
  //   } else {
  //     // For documents
  //     return (
  //       <AttachmentPreview key={attachment.id}>
  //         <Document 
  //           theme={theme}
  //           onClick={() => window.open(attachment.filePath, '_blank')}
  //         >
  //           <DocumentIcon theme={theme}>
  //             <i className="material-icons">insert_drive_file</i>
  //           </DocumentIcon>
  //           <DocumentInfo>
  //             <DocumentName theme={theme}>{attachment.fileName}</DocumentName>
  //             <DocumentSize theme={theme}>
  //               {Math.round((attachment.fileSize || 0) / 1024)} KB
  //             </DocumentSize>
  //           </DocumentInfo>
  //         </Document>
  //       </AttachmentPreview>
  //     );
  //   }
  // };
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'sending':
        return <i className="material-icons" style={{ fontSize: '12px' }}>access_time</i>;
      case 'sent':
        return <i className="material-icons" style={{ fontSize: '12px' }}>check</i>;
      case 'delivered':
        return <i className="material-icons" style={{ fontSize: '12px' }}>done_all</i>;
      case 'read':
        return <i className="material-icons" style={{ fontSize: '12px', color: '#2196F3' }}>done_all</i>;
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return <LoadingIndicator theme={theme}>Loading messages...</LoadingIndicator>;
  }
  
  if (!processedMessages || processedMessages.length === 0) {
    return <NoMessages theme={theme}>No messages yet. Start the conversation!</NoMessages>;
  }
  
  const messageGroups = groupMessagesByDate();
  
  return (
    <ListContainer theme={theme}>
      {messageGroups.map(group => (
        <MessageGroup key={group.date}>
          <MessageDate theme={theme}>{formatDate(group.date)}</MessageDate>
          
          {group.messages.map(message => {
            const isSent = message.senderId === currentUserId;
            const messageId = message.id || message.clientMessageId || Math.random().toString(36).substr(2, 9);
            
            return (
              <MessageBubble 
                key={messageId}
                isSent={isSent}
                theme={theme}
              >
                {isGroup && !isSent && message.sender && (
                  <SenderName>{message.sender.username}</SenderName>
                )}
                
                <MessageContent>{message.content}</MessageContent>
                
                {message.attachments && Array.isArray(message.attachments) && 
                  message.attachments.map(attachment => renderAttachment(attachment))}
                
                <MessageTime theme={theme}>
                  {formatTime(message.timestamp || message.createdAt)}
                  {isSent && (
                    <MessageStatus 
                      status={message.status}
                      theme={theme}
                    >
                      {getStatusIcon(message.status)}
                    </MessageStatus>
                  )}
                </MessageTime>
              </MessageBubble>
            );
          })}
        </MessageGroup>
      ))}

      {showPreview && previewImages.length > 0 && (
        <ImagePreview 
          images={previewImages}
          initialIndex={previewIndex}
          onClose={() => setShowPreview(false)} 
        />
      )}

      <div ref={messagesEndRef} />
    </ListContainer>
  );
};

export default MessageList;