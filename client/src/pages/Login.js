// client/src/pages/Login.js - Updated with flat WhatsApp-like design
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { MessageSquare } from 'lucide-react';

// Import Redux actions
import { login } from '../redux/slices/authSlice';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  height: 100vh;
  padding: 20px;
  background-color: ${props => props.theme === 'dark' ? '#121212' : '#FFFFFF'};
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  width: 100%;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  margin-top: 60px;
  margin-bottom: 40px;
`;

const LogoText = styled.h1`
  font-size: 2em;
  margin-left: 10px;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#128C7E'};
  font-weight: 500;
`;

const FormContainer = styled.div`
  width: 100%;
  max-width: 400px;
  padding: 0 20px;
`;

const Title = styled.h2`
  font-size: 1.5em;
  margin-bottom: 30px;
  text-align: center;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  font-weight: 500;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 25px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: ${props => props.theme === 'dark' ? '#ccc' : '#666'};
  font-size: 0.9em;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 0;
  border: none;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#444' : '#ddd'};
  background-color: transparent;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  font-size: 1em;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'dark' ? '#128C7E' : '#128C7E'};
  }
`;

const Button = styled.button`
  padding: 12px;
  background-color: #128C7E; /* WhatsApp green color */
  color: white;
  border: none;
  border-radius: 24px; /* Rounded corners like WhatsApp */
  cursor: pointer;
  font-size: 1em;
  font-weight: 600; /* Slightly bolder text */
  text-transform: uppercase; /* WhatsApp uses uppercase text */
  letter-spacing: 0.5px;
  width: 100%;
  margin-top: 20px;
  
  &:hover {
    background-color: #075E54; /* Darker green on hover */
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #f44336;
  margin-bottom: 15px;
  text-align: center;
`;

const RegisterLink = styled.div`
  margin-top: 30px;
  text-align: center;
  color: ${props => props.theme === 'dark' ? '#ccc' : '#666'};
  
  a {
    color: #128C7E;
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Login = () => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector(state => state.auth);
  const { theme } = useSelector(state => state.ui);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(formData));
  };
  
  return (
    <LoginContainer theme={theme}>
      <Logo>
        <MessageSquare size={40} color="#128C7E" />
        <LogoText theme={theme}>Synapse</LogoText>
      </Logo>
      
      <FormContainer>
        <Title theme={theme}>Enter your credentials</Title>
        
        {error && <ErrorMessage>{error.message}</ErrorMessage>}
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label theme={theme}>Email</Label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              theme={theme}
              placeholder="Your email address"
            />
          </FormGroup>
          
          <FormGroup>
            <Label theme={theme}>Password</Label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              theme={theme}
              placeholder="Your password"
            />
          </FormGroup>
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </Form>
        
        {/* <RegisterLink theme={theme}>
          Don't have an account? <Link to="/register">Register</Link>
        </RegisterLink> */}
      </FormContainer>
    </LoginContainer>
  );
};

export default Login;