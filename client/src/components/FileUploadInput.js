// client/src/components/FileUploadInput.js
import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import styled from 'styled-components';
import { File, FileText, Image, Film, Music, AlertCircle, X } from 'lucide-react';
import chatService from '../services/chatService';

const UploadContainer = styled.div`
  margin-bottom: 10px;
`;

const FilePreviewArea = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
`;

const FilePreview = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  background-color: ${props => props.theme === 'dark' ? '#333' : '#f0f0f0'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#ddd'};
`;

const FileIconContainer = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
`;

const FileName = styled.div`
  font-size: 10px;
  padding: 0 5px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  color: ${props => props.theme === 'dark' ? '#ccc' : '#333'};
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
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.7);
  }
`;

const ProgressOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: ${props => props.progress}%;
  height: 4px;
  background-color: #4caf50;
`;

const UploadError = styled.div`
  color: #f44336;
  font-size: 0.8em;
  margin-top: 5px;
`;

const FileUploadInput = forwardRef(({ onFileSelected, theme }, ref) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const fileInputRef = useRef(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openFileSelector: () => fileInputRef.current?.click(),
    // Update the uploadAllFiles method in FileUploadInput to return the result
    uploadAllFiles: async () => {
      console.log("Attempting to upload all files:", selectedFiles);
      
      if (selectedFiles.length === 0) return [];
      
      // Create an array of upload promises
      const uploadPromises = selectedFiles.map(file => uploadFile(file));
      
      // Wait for all uploads to complete
      try {
        const results = await Promise.all(uploadPromises);
        console.log("All files uploaded successfully:", results);
        
        // Clear selected files after successful upload
        setSelectedFiles([]);
        
        return results;
      } catch (error) {
        console.error('Error uploading files:', error);
        throw error;
      }
    },
    hasSelectedFiles: selectedFiles.length > 0
  }));

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Process each file
    const newFiles = files.map(file => ({
      file,
      id: Math.random().toString(36).substring(2),
      name: file.name,
      type: file.type,
      size: file.size,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
    
    // Clear the input to allow re-selection of the same file
    e.target.value = '';
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image size={24} />;
    if (fileType.startsWith('video/')) return <Film size={24} />;
    if (fileType.startsWith('audio/')) return <Music size={24} />;
    if (fileType.includes('pdf')) return <FileText size={24} />;
    return <File size={24} />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const removeFile = (id) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== id));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[id];
      return newProgress;
    });
    setUploadErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  };

  const uploadFile = async (fileObj) => {
    console.log("Upload file", fileObj);
    
    try {
      setUploadProgress(prev => ({ ...prev, [fileObj.id]: 0 }));
      setUploadErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fileObj.id];
        return newErrors;
      });
      
      const formData = new FormData();
      formData.append('file', fileObj.file);
      
      const response = await chatService.uploadAttachment(
        fileObj.file,
        // Progress callback
        (progressEvent) => {
          const percentage = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(prev => ({ ...prev, [fileObj.id]: percentage }));
        }
      );

      console.log("uploadAttachment response", response);
      
      
      // Upload complete
      setUploadProgress(prev => ({ ...prev, [fileObj.id]: 100 }));
      
      // Call the callback with the uploaded attachment info
      const attachmentInfo = {
        id: response.data.id,
        fileName: response.data.fileName,
        fileType: response.data.fileType,
        fileCategory: response.data.fileCategory || '',
        fileSize: response.data.fileSize,
        filePath: response.data.filePath,
        localId: fileObj.id
      };
      
      onFileSelected(attachmentInfo);
      
      // Remove the setTimeout here - let the parent component manage the state
      // Just mark as completed
      setUploadProgress(prev => ({ ...prev, [fileObj.id]: 100 }));
      
      return attachmentInfo;
      
    } catch (error) {
      console.error('File upload error:', error);
      setUploadErrors(prev => ({ 
        ...prev, 
        [fileObj.id]: error.response?.data?.message || 'Upload failed' 
      }));
      throw error;
    }
  };

  const uploadAllFiles = () => {
    selectedFiles.forEach(file => {
      uploadFile(file);
    });
  };

  return (
    <UploadContainer>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
        multiple
      />
      
      {selectedFiles.length > 0 && (
        <FilePreviewArea>
          {selectedFiles.map(file => (
            <FilePreview key={file.id} theme={theme}>
              {file.preview ? (
                <PreviewImage src={file.preview} alt={file.name} />
              ) : (
                <>
                  <FileIconContainer theme={theme}>
                    {getFileIcon(file.type)}
                  </FileIconContainer>
                  <FileName theme={theme}>
                    {file.name.length > 15 
                      ? file.name.substring(0, 12) + '...' 
                      : file.name}
                  </FileName>
                </>
              )}
              
              <RemoveButton onClick={() => removeFile(file.id)}>
                <X size={12} />
              </RemoveButton>
              
              {uploadProgress[file.id] !== undefined && (
                <ProgressOverlay progress={uploadProgress[file.id]} />
              )}
              
              {uploadErrors[file.id] && (
                <AlertCircle size={20} color="#f44336" style={{ position: 'absolute', bottom: 5, right: 5 }} />
              )}
            </FilePreview>
          ))}
        </FilePreviewArea>
      )}
      
      {Object.keys(uploadErrors).length > 0 && (
        <UploadError>
          Some files failed to upload. Please try again.
        </UploadError>
      )}
      
      {/* Don't use React.Children.only here - just return the container */}
    </UploadContainer>
  );
});

export default FileUploadInput;