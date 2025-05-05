import { useFilePreview } from '../contexts/FilePreviewContext';

const AttachmentPreview = ({ attachment, theme }) => {
  const { fileName, fileType, fileSize, filePath } = attachment;
  const { openPreview } = useFilePreview();
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const getFileIcon = () => {
    if (fileType.startsWith('image/')) return <Image size={24} />;
    if (fileType.startsWith('video/')) return <Film size={24} />;
    if (fileType.startsWith('audio/')) return <Music size={24} />;
    if (fileType.includes('pdf')) return <FileText size={24} />;
    return <File size={24} />;
  };
  
  const handleDownload = (e) => {
    e.stopPropagation();
    window.open(process.env.REACT_APP_BACKEND_URL + filePath, '_blank');
  };
  
  const handleClick = () => {
    // Open file preview or download
    // window.open(process.env.REACT_APP_BACKEND_URL + filePath, '_blank');
    openPreview(attachment);
  };
  
  // For image attachments
  if (fileType.startsWith('image/')) {
    return (
      <PreviewContainer>
        <ImagePreview 
          src={process.env.REACT_APP_BACKEND_URL + filePath} 
          alt={fileName}
          onClick={handleClick}
          theme={theme}
        />
      </PreviewContainer>
    );
  }
  
  // For other file types
  return (
    <PreviewContainer>
      <FileContainer onClick={handleClick} theme={theme}>
        <FileIconContainer theme={theme}>
          {getFileIcon()}
        </FileIconContainer>
        <FileInfo>
          <FileName theme={theme}>{fileName}</FileName>
          <FileSize theme={theme}>{formatFileSize(fileSize)}</FileSize>
        </FileInfo>
        <DownloadButton onClick={handleDownload} theme={theme}>
          <Download size={20} />
        </DownloadButton>
      </FileContainer>
    </PreviewContainer>
  );
};

export default AttachmentPreview;