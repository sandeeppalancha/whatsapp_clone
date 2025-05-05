// client/src/components/MessageList.js - Complete fixed version
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

const ListContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: ${props => props.theme === 'dark' ? '#121212' : '#f5f5f5'};
  display: flex;
  flex-direction: column;
`;

const MessageGroup = styled.div`
  margin-bottom: 20px;
`;

const MessageDate = styled.div`
  text-align: center;
  margin: 20px 0;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#777'};
  font-size: 0.9em;
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 12px 15px;
  border-radius: 18px;
  margin-bottom: 10px;
  position: relative;
  word-wrap: break-word;
  padding-bottom: 15px; /* Make room for timestamp */
  
  ${props => props.isSent ? `
    background-color: ${props.theme === 'dark' ? '#2a5885' : '#e3f2fd'};
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

const MessageContent = styled.div`
  margin-right: 35px; /* Space for timestamp */
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
  margin-top: 5px;
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
    return date.toLocaleDateString();
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

  const renderAttachment = (attachment) => {
    if (!attachment) return null;
    
    return <AttachmentPreview attachment={attachment} theme={theme} />;
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
      
      <div ref={messagesEndRef} />
    </ListContainer>
  );
};

export default MessageList;