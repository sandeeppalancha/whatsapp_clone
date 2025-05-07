// client/src/components/CameraCapture.js
import React, { useState } from 'react';
import styled from 'styled-components';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

const CameraCaptureContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #000;
  z-index: 1100;
  display: flex;
  flex-direction: column;
`;

const PreviewContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
`;

const CapturedImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 20px;
  background-color: #111;
`;

const CaptureButton = styled.button`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: #fff;
  border: 3px solid #666;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:focus {
    outline: none;
  }
`;

const ActionButton = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:focus {
    outline: none;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
`;

const SwitchCameraButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
`;

const CameraCapture = ({ onCapture, onClose }) => {
  const [photoPath, setPhotoPath] = useState(null);
  const [cameraSource, setCameraSource] = useState(CameraSource.Camera);
  
  const takePicture = async () => {
    try {
      // Take the picture
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: cameraSource,
        saveToGallery: false
      });
      
      // Set the captured image path
      setPhotoPath(image.webPath);
    } catch (error) {
      console.error('Error taking picture:', error);
      if (error.message !== 'User cancelled photo capture') {
        alert('Failed to take picture. Please try again.');
      }
    }
  };
  
  const toggleCamera = async () => {
    // Toggle between front and rear camera
    setCameraSource(cameraSource === CameraSource.Camera 
      ? CameraSource.Camera_Front 
      : CameraSource.Camera);
    
    // If we have a photo, clear it so the user can take a new one
    if (photoPath) {
      setPhotoPath(null);
    } else {
      // If no photo is taken yet, retrigger the camera
      takePicture();
    }
  };
  
  const retakePicture = () => {
    setPhotoPath(null);
    takePicture();
  };
  
  const confirmPicture = () => {
    if (photoPath) {
      // Convert the URI to a file or blob as needed by your app
      fetchImageAndConvert(photoPath)
        .then(file => {
          onCapture(file);
        })
        .catch(error => {
          console.error('Error converting image:', error);
          alert('Failed to process image. Please try again.');
        });
    }
  };
  
  // Helper function to fetch the image from URI and convert to File
  const fetchImageAndConvert = async (imageUri) => {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Create a File object from the blob
    const fileName = `photo_${new Date().getTime()}.jpg`;
    const file = new File([blob], fileName, { type: 'image/jpeg' });
    
    return file;
  };
  
  // Automatically trigger camera on component mount
  React.useEffect(() => {
    takePicture();
  }, []);
  
  return (
    <CameraCaptureContainer>
      <PreviewContainer>
        {photoPath ? (
          <CapturedImage src={photoPath} alt="Captured" />
        ) : (
          <div style={{ color: 'white', fontSize: '18px' }}>Starting camera...</div>
        )}
        
        <CloseButton onClick={onClose}>
          <X size={24} />
        </CloseButton>
        
        <SwitchCameraButton onClick={toggleCamera}>
          <Camera size={24} />
        </SwitchCameraButton>
      </PreviewContainer>
      
      <ControlsContainer>
        {photoPath ? (
          <>
            <ActionButton onClick={retakePicture}>
              <RotateCcw size={24} />
            </ActionButton>
            
            <CaptureButton onClick={confirmPicture}>
              <Check size={36} color="#000" />
            </CaptureButton>
            
            <div style={{ width: 50 }}></div> {/* Empty space for alignment */}
          </>
        ) : (
          <>
            <div style={{ width: 50 }}></div> {/* Empty space for alignment */}
            
            <CaptureButton onClick={takePicture}>
              <div style={{ 
                width: 60, 
                height: 60, 
                borderRadius: '50%', 
                border: '2px solid #666' 
              }}></div>
            </CaptureButton>
            
            <div style={{ width: 50 }}></div> {/* Empty space for alignment */}
          </>
        )}
      </ControlsContainer>
    </CameraCaptureContainer>
  );
};

export default CameraCapture;