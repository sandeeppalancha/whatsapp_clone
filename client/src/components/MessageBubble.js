// client/src/components/MessageBubble.js
import React from 'react';
import styled from 'styled-components';
import { Check, CheckCheck, Reply, Forward } from 'lucide-react';

const Bubble = styled.div`
  max-width: 70%;
  width: fit-content;
  padding: 12px 15px;
  border-radius: 18px;
  margin-bottom: 10px;
  position: relative;
  word-wrap: break-word;
  padding-bottom: 28px; /* Make room for timestamp and actions */
  
  ${props => props.isSent ? `
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

const ReplyIndicator = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#404040' : '#f0f0f0'};
  border-left: 3px solid #4caf50;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 5px;
  font-size: 0.85em;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#4a4a4a' : '#e8e8e8'};
  }
`;

const ReplyHeader = styled.div`
  font-weight: bold;
  color: #4caf50;
  margin-bottom: 4px;
  font-size: 0.9em;
`;

const ReplyContent = styled.div`
  color: ${props => props.theme === 'dark' ? '#ccc' : '#666'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ForwardIndicator = styled.div`
  display: flex;
  align-items: center;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
  font-size: 0.8em;
  margin-bottom: 5px;
  font-style: italic;
  
  svg {
    margin-right: 5px;
  }
`;

const MessageContent = styled.div`
  margin-right: 60px; /* Space for timestamp */
`;

const MessageActions = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  display: none;
  gap: 5px;
  
  ${Bubble}:hover & {
    display: flex;
  }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#555' : '#e8e8e8'};
    color: ${props => props.theme === 'dark' ? '#fff' : '#333'};
  }
`;

const MessageTime = styled.div`
  font-size: 0.7em;
  color: ${props => props.theme === 'dark' ? '#ccc' : '#999'};
  position: absolute;
  bottom: 5px;
  right: 10px;
  display: flex;
  align-items: center;
`;

const MessageStatus = styled.span`
  margin-left: 4px;
  display: flex;
  align-items: center;
  
  svg {
    width: 14px;
    height: 14px;
  }
  
  /* Default gray color for ticks */
  color: ${props => props.theme === 'dark' ? '#aaa' : '#8D8D8D'};
  
  /* Blue color for read ticks */
  ${props => props.status === 'read' && `
    color: #4FC3F7;
  `}
`;

const AttachmentPreview = styled.div`
  margin-top: 8px;
`;

const MessageBubble = ({ 
  message, 
  isSent, 
  theme, 
  onReply, 
  onForward,
  onReplyClick 
}) => {
  const { 
    content, 
    replyTo, 
    isForwarded, 
    originalSender,
    timestamp,
    status,
    attachments
  } = message;

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sending':
        return (
          <svg viewBox="0 0 16 15" width="16" height="15" className="clock-icon">
            <circle cx="8" cy="7.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="8" y1="7.5" x2="8" y2="4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="8" y1="7.5" x2="10.5" y2="7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        );
      case 'sent':
        return <Check size={16} />;
      case 'delivered':
        return <CheckCheck size={16} />;
      case 'read':
        return <CheckCheck size={16} />;
      default:
        return null;
    }
  };

  return (
    <Bubble isSent={isSent} theme={theme}>
      <MessageActions theme={theme}>
        <ActionButton onClick={() => onReply(message)} theme={theme}>
          <Reply size={16} />
        </ActionButton>
        <ActionButton onClick={() => onForward(message)} theme={theme}>
          <Forward size={16} />
        </ActionButton>
      </MessageActions>

      {replyTo && (
        <ReplyIndicator 
          theme={theme}
          onClick={() => onReplyClick(replyTo.id)}
        >
          <ReplyHeader>
            {replyTo.sender?.username || 'Unknown'}
          </ReplyHeader>
          <ReplyContent theme={theme}>
            {replyTo.content || '[Attachment]'}
          </ReplyContent>
        </ReplyIndicator>
      )}

      {isForwarded && (
        <ForwardIndicator theme={theme}>
          <Forward size={14} />
          Forwarded{originalSender && ` from ${originalSender.username}`}
        </ForwardIndicator>
      )}

      <MessageContent>{content}</MessageContent>

      {attachments && attachments.length > 0 && (
        <AttachmentPreview>
          {/* Render attachments here */}
        </AttachmentPreview>
      )}

      <MessageTime theme={theme}>
        {formatTime(timestamp)}
        {isSent && (
          <MessageStatus status={status} theme={theme}>
            {getStatusIcon(status)}
          </MessageStatus>
        )}
      </MessageTime>
    </Bubble>
  );
};

export default MessageBubble;