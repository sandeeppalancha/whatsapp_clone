// client/src/components/ImagePreview.js
import React, { useState } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const PreviewContainer = styled.div`
  position: relative;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  flex-direction: column;
`;

const ImageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
`;

const CloseButton = styled.button`
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  
  &:hover {
    color: #ccc;
  }
`;

const ImageInfo = styled.div`
  margin-top: 15px;
  color: white;
  text-align: center;
`;

const ImageName = styled.div`
  font-size: 16px;
  margin-bottom: 5px;
`;

const ImagePreview = ({ image, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <Overlay onClick={onClose}>
      <PreviewContainer onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <X size={24} />
        </CloseButton>
        
        <ImageContainer>
          {isLoading && <div style={{ color: 'white' }}>Loading...</div>}
          <PreviewImage 
            src={image.src} 
            alt={image.name || 'Image preview'} 
            onLoad={handleImageLoad}
          />
        </ImageContainer>
        
        {image.name && (
          <ImageInfo>
            <ImageName>{image.name}</ImageName>
          </ImageInfo>
        )}
      </PreviewContainer>
    </Overlay>
  );
};

export default ImagePreview;