// client/src/contexts/FilePreviewContext.js
import React, { createContext, useState, useContext } from 'react';
import FilePreviewModal from '../components/FilePreviewModal';
import { useSelector } from 'react-redux';

const FilePreviewContext = createContext();

export const useFilePreview = () => useContext(FilePreviewContext);

export const FilePreviewProvider = ({ children }) => {
  const [previewFile, setPreviewFile] = useState(null);
  const { theme } = useSelector(state => state.ui);
  
  const openPreview = (attachment) => {
    setPreviewFile(attachment);
  };
  
  const closePreview = () => {
    setPreviewFile(null);
  };
  
  return (
    <FilePreviewContext.Provider value={{ openPreview }}>
      {children}
      {previewFile && (
        <FilePreviewModal 
          attachment={previewFile} 
          onClose={closePreview}
          theme={theme}
        />
      )}
    </FilePreviewContext.Provider>
  );
};