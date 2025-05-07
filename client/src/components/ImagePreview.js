// client/src/components/ImagePreview.js
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

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
  touch-action: none;
`;

const PreviewContainer = styled.div`
  position: relative;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const ImageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 100%;
  height: 100%;
  position: relative;
`;

const PreviewImage = styled.img`
  max-width: ${props => 100 * props.zoom}%;
  max-height: ${props => 80 * props.zoom}vh;
  object-fit: contain;
  transition: transform 0.1s ease-out;
  transform: translate(${props => props.panX}px, ${props => props.panY}px);
  cursor: ${props => props.zoom > 1 ? 'grab' : 'default'};
  
  ${props => props.isDragging && `
    cursor: grabbing;
  `}
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  
  &:hover {
    background: rgba(0, 0, 0, 0.7);
  }
`;

const NavigationButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.7);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  ${props => props.left ? 'left: 10px;' : 'right: 10px;'}
`;

const ZoomControls = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 10;
`;

const ZoomButton = styled.button`
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(0, 0, 0, 0.7);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ZoomLevel = styled.div`
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 20px;
  padding: 0 15px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
`;

const ImageInfo = styled.div`
  position: absolute;
  bottom: 80px;
  left: 0;
  right: 0;
  color: white;
  text-align: center;
  background: rgba(0, 0, 0, 0.5);
  padding: 10px;
`;

const ImageCounter = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 14px;
`;

const LoadingIndicator = styled.div`
  color: white;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
`;

const ImagePreview = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
  const [startPanPos, setStartPanPos] = useState({ x: 0, y: 0 });
  const [touchStartX, setTouchStartX] = useState(null);
  
  const imageRef = useRef(null);
  
  // Reset pan position when changing images
  useEffect(() => {
    setPanX(0);
    setPanY(0);
    setZoom(1);
    setIsLoading(true);
  }, [currentIndex]);
  
  const currentImage = images[currentIndex];
  
  const handleImageLoad = () => {
    setIsLoading(false);
  };
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
    setPanX(0);
    setPanY(0);
  };
  
  const handleZoomOut = () => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setPanX(0);
        setPanY(0);
      }
      return newZoom;
    });
  };
  
  const handlePrevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const handleNextImage = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setStartDragPos({ x: e.clientX, y: e.clientY });
      setStartPanPos({ x: panX, y: panY });
    }
  };
  
  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      const deltaX = e.clientX - startDragPos.x;
      const deltaY = e.clientY - startDragPos.y;
      setPanX(startPanPos.x + deltaX);
      setPanY(startPanPos.y + deltaY);
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      // Single touch for dragging if zoomed
      if (zoom > 1) {
        setIsDragging(true);
        setStartDragPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        setStartPanPos({ x: panX, y: panY });
      }
      
      // Store the X position for swiping between images
      setTouchStartX(e.touches[0].clientX);
    }
  };
  
  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      // Dragging if zoomed
      if (isDragging && zoom > 1) {
        const deltaX = e.touches[0].clientX - startDragPos.x;
        const deltaY = e.touches[0].clientY - startDragPos.y;
        setPanX(startPanPos.x + deltaX);
        setPanY(startPanPos.y + deltaY);
        
        // Prevent default to stop page scrolling
        e.preventDefault();
      }
    }
  };
  
  const handleTouchEnd = (e) => {
    setIsDragging(false);
    
    // Handle swiping between images (only if not zoomed)
    if (touchStartX !== null && zoom === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchEndX - touchStartX;
      
      // Threshold for swipe (adjust as needed)
      const SWIPE_THRESHOLD = 50;
      
      if (deltaX > SWIPE_THRESHOLD && currentIndex > 0) {
        // Swipe right -> previous image
        handlePrevImage();
      } else if (deltaX < -SWIPE_THRESHOLD && currentIndex < images.length - 1) {
        // Swipe left -> next image
        handleNextImage();
      }
    }
    
    setTouchStartX(null);
  };
  
  // Key navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevImage();
          break;
        case 'ArrowRight':
          handleNextImage();
          break;
        case 'Escape':
          onClose();
          break;
        case '+':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length]);
  
  return (
    <Overlay 
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <PreviewContainer onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <X size={24} />
        </CloseButton>
        
        <ImageCounter>{currentIndex + 1} / {images.length}</ImageCounter>
        
        <NavigationButton 
          left 
          onClick={handlePrevImage} 
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={30} />
        </NavigationButton>
        
        <NavigationButton 
          onClick={handleNextImage} 
          disabled={currentIndex === images.length - 1}
        >
          <ChevronRight size={30} />
        </NavigationButton>
        
        <ImageContainer>
          {isLoading && <LoadingIndicator>Loading...</LoadingIndicator>}
          <PreviewImage 
            ref={imageRef}
            src={currentImage.src} 
            alt={currentImage.name || 'Image preview'} 
            onLoad={handleImageLoad}
            zoom={zoom}
            panX={panX}
            panY={panY}
            isDragging={isDragging}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          />
        </ImageContainer>
        
        {currentImage.name && (
          <ImageInfo>
            {currentImage.name}
          </ImageInfo>
        )}
        
        <ZoomControls>
          <ZoomButton 
            onClick={handleZoomOut} 
            disabled={zoom === 1}
          >
            <ZoomOut size={20} />
          </ZoomButton>
          
          <ZoomLevel>{Math.round(zoom * 100)}%</ZoomLevel>
          
          <ZoomButton 
            onClick={handleZoomIn} 
            disabled={zoom >= 3}
          >
            <ZoomIn size={20} />
          </ZoomButton>
        </ZoomControls>
      </PreviewContainer>
    </Overlay>
  );
};

export default ImagePreview;