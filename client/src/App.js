// client/src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import styled from 'styled-components';
import { Camera } from '@capacitor/camera';

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
import { FilePreviewProvider } from './contexts/FilePreviewContext';

// Check if running on a native platform
const isNative = Capacitor.isNativePlatform();

// Check if mobile view based on screen size or platform
const isMobileView = () => {
  return isNative || window.innerWidth < 768;
};

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
  padding-bottom: ${props => props.showBottomNav ? '60px' : '0'};
  display: flex;
  /* Desktop layout */
  @media (min-width: 768px) {
    display: flex;
    flex-direction: row;
  }
`;

const SidebarContainer = styled.div`
  display: ${props => props.isMobile && !props.showSidebar ? 'none' : 'flex'};
  flex-direction: column;
  width: 100%;
  
  /* Desktop layout */
  @media (min-width: 768px) {
    display: flex;
    width: 350px;
    border-right: 1px solid ${props => props.theme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
  }
`;

const MainContainer = styled.div`
  display: ${props => props.isMobile && props.showSidebar ? 'none' : 'flex'};
  flex-direction: column;
  flex: 1;
  
  /* Desktop layout */
  @media (min-width: 768px) {
    display: flex;
  }
`;

const EmptyStateContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#f0f0f0'};
  color: ${props => props.theme === 'dark' ? '#aaa' : '#777'};
  font-size: 1.2rem;
  flex-direction: column;
`;

const EmptyStateImage = styled.div`
  width: 150px;
  height: 150px;
  margin-bottom: 20px;
  opacity: 0.5;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>');
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
`;

// Desktop empty state component
const EmptyState = ({ theme }) => (
  <EmptyStateContainer theme={theme}>
    <EmptyStateImage theme={theme} />
    <div>Select a conversation to start chatting</div>
  </EmptyStateContainer>
);

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
  const [mobile, setMobile] = useState(isMobileView());
  
  // Update mobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setMobile(isMobileView());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Determine if we should show the bottom nav
  // Hide it on chat and group pages on mobile
  const isChatRoute = location.pathname.startsWith('/chat/');
  const isGroupRoute = location.pathname.startsWith('/group/');

  const isProfileRoute = location.pathname === '/profile';  // Add this line
  const isSettingsRoute = location.pathname === '/settings';  // Add this line

  const isInChatView = isChatRoute || isGroupRoute;
  
  // On mobile, bottom nav is shown if not in chat view
  // On desktop, bottom nav is never shown
  const showBottomNav = isAuthenticated && !isInChatView && mobile;
  
  const isInSpecificView = isChatRoute || isGroupRoute || isProfileRoute || isSettingsRoute;
  // Show sidebar (conversation list) based on route
  const showSidebar = !isInSpecificView;
  
  // Render content based on route and device type
  const renderContent = () => {
    if (!isAuthenticated) {
      return children;
    }
    
    return (
      <>
        <SidebarContainer 
          isMobile={mobile} 
          showSidebar={showSidebar}
          theme={theme}
        >
          <Home />
        </SidebarContainer>
        
        <MainContainer 
          isMobile={mobile}
          showSidebar={showSidebar}
        >
          {isInChatView ? (
            children
          ) : isProfileRoute ? (
            <Profile />
          ) : isSettingsRoute ? (
            <Settings />
          ) : (
            !mobile && <EmptyState theme={theme} />
          )}
        </MainContainer>
      </>
    );
  };
  
  return (
    <>
      <ContentContainer showBottomNav={showBottomNav}>
        {renderContent()}
      </ContentContainer>
      
      {showBottomNav && <BottomNav theme={theme} />}
    </>
  );
};

// Chat route component
const ChatRoute = () => {
  const { id } = useParams();
  return <Chat />;
};

// Group route component
const GroupRoute = () => {
  const { id } = useParams();
  return <Group />;
};

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector(state => state.auth);
  const { theme } = useSelector(state => state.ui);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Set status bar based on theme
      StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
      
      // Make room for the status bar (pushes content down)
      StatusBar.setOverlaysWebView({ overlay: false });
    }
  }, [theme]);
  
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
          if (Capacitor.isNativePlatform()) {
            console.log('Initializing push notifications...');
            try {
              await initializePushNotifications();
              console.log('Push notifications initialized successfully');
            } catch (error) {
              console.error('Failed to initialize push notifications:', error);
              // Continue app execution even if push notifications fail
            }
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
      <FilePreviewProvider>
        <Router>
          <NavigationController>
            <Routes>
              <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
              <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
              
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    {/* No component needed here - Home is rendered in NavigationController */}
                    <></>
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
      </FilePreviewProvider>
    </AppContainer>
  );
}

export default App;