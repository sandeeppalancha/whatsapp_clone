// client/src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Capacitor } from '@capacitor/core';
import styled from 'styled-components';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Group from './pages/Group';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Import components
import BottomNav from './components/BottomNav';

// Import services
import { initializeSocket } from './services/socketService';
import { initializePushNotifications } from './services/pushNotificationService';
import authService from './services/authService';

// Import Redux actions
import { setCredentials } from './redux/slices/authSlice';

// Check if running on a native platform
const isNative = Capacitor.isNativePlatform();

// Define styled components
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${props => props.theme === 'dark' ? '#121212' : '#f5f5f5'};
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#121212'};
`;

const ContentContainer = styled.div`
  flex: 1;
  overflow: hidden;
  padding-bottom: ${props => props.showBottomNav ? '60px' : '0'}; /* Adjust padding based on bottom nav visibility */
`;

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector(state => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Navigation controller component
const NavigationController = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useSelector(state => state.auth);
  const { theme } = useSelector(state => state.ui);
  
  // Determine if we should show the bottom nav
  // Hide it on chat and group pages
  const isChat = location.pathname.startsWith('/chat/');
  const isGroup = location.pathname.startsWith('/group/');
  const showBottomNav = isAuthenticated && !isChat && !isGroup;
  
  return (
    <>
      <ContentContainer showBottomNav={showBottomNav}>
        {children}
      </ContentContainer>
      
      {showBottomNav && <BottomNav theme={theme} />}
    </>
  );
};

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector(state => state.auth);
  const { theme } = useSelector(state => state.ui);
  
  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = async () => {
      try {
        if (token) {
          // Get current user data
          const response = await authService.getCurrentUser();
          dispatch(setCredentials({
            user: response.data,
            token
          }));
          
          // Initialize socket connection
          initializeSocket(token);
          
          // Initialize push notifications on native platforms
          if (isNative) {
            initializePushNotifications();
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    
    checkAuthStatus();
  }, [dispatch, token]);
  
  return (
    <AppContainer theme={theme}>
      <Router>
        <NavigationController>
          <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
            
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/chat/:id" 
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/group/:id" 
              element={
                <ProtectedRoute>
                  <Group />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NavigationController>
      </Router>
    </AppContainer>
  );
}

export default App;