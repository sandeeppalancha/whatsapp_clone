// client/src/components/FilePreviewModal.js
import React from 'react';
import styled from 'styled-components';
import { X, Download, File, FileText, Film, Music } from 'lucide-react';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#fff'};
  border-radius: 10px;
  max-width: 90%;
  max-height: 90vh;
  width: auto;
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

const HeaderTitle = styled.div`
  flex: 1;
  font-weight: 500;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 10px;
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
`;

const ModalContent = styled.div`
  padding: 20px;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
`;

const ImagePreview = styled.img`
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
`;

const VideoPreview = styled.video`
  max-width: 100%;
  max-height: 70vh;
`;

const AudioPreview = styled.audio`
  width: 100%;
  max-width: 500px;
`;

const FilePreview = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
`;

const FileIconLarge = styled.div`
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
`;

const FileInfoText = styled.div`
  margin-top: 10px;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
`;

const DownloadButton = styled.button`
  display: flex;
  align-items: center;
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  
  &:hover {
    background-color: #3e8e41;
  }
  
  svg {
    margin-right: 8px;
  }
`;

const PDFPreview = styled.iframe`
  width: 100%;
  height: 70vh;
  border: none;
`;

const FilePreviewModal = ({ attachment, onClose, theme }) => {
  if (!attachment) return null;
  
  const { fileName, fileType, fileSize, filePath } = attachment;
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const getFileIcon = () => {
    if (fileType.includes('pdf')) return <FileText size={64} />;
    if (fileType.startsWith('video/')) return <Film size={64} />;
    if (fileType.startsWith('audio/')) return <Music size={64} />;
    return <File size={64} />;
  };
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = process.env.REACT_APP_BACKEND_URL + filePath;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Render content based on file type
  const renderPreview = () => {
    // Image preview
    if (fileType.startsWith('image/')) {
      return (
        <ImagePreview 
          src={process.env.REACT_APP_BACKEND_URL + filePath} 
          alt={fileName} 
        />
      );
    }
    
    // Video preview
    if (fileType.startsWith('video/')) {
      return (
        <VideoPreview controls>
          <source src={process.env.REACT_APP_BACKEND_URL + filePath} type={fileType} />
          Your browser does not support the video tag.
        </VideoPreview>
      );
    }
    
    // Audio preview
    if (fileType.startsWith('audio/')) {
      return (
        <AudioPreview controls>
          <source src={process.env.REACT_APP_BACKEND_URL + filePath} type={fileType} />
          Your browser does not support the audio tag.
        </AudioPreview>
      );
    }
    
    // PDF preview
    if (fileType === 'application/pdf') {
      return (
        <PDFPreview 
          src={`${process.env.REACT_APP_BACKEND_URL}${filePath}#toolbar=0`} 
          title={fileName}
        />
      );
    }
    
    // Generic file preview
    return (
      <FilePreview>
        <FileIconLarge theme={theme}>
          {getFileIcon()}
        </FileIconLarge>
        <div>{fileName}</div>
        <FileInfoText theme={theme}>{formatFileSize(fileSize)}</FileInfoText>
        <DownloadButton onClick={handleDownload}>
          <Download size={20} />
          Download
        </DownloadButton>
      </FilePreview>
    );
  };
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer 
        theme={theme} 
        onClick={e => e.stopPropagation()}
      >
        <ModalHeader theme={theme}>
          <HeaderTitle theme={theme}>{fileName}</HeaderTitle>
          <IconButton onClick={onClose} theme={theme}>
            <X size={24} />
          </IconButton>
        </ModalHeader>
        
        <ModalContent>
          {renderPreview()}
        </ModalContent>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default FilePreviewModal;