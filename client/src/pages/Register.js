// client/src/pages/Register.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { MessageSquare } from 'lucide-react';

// Import Redux actions
import { register } from '../redux/slices/authSlice';

const RegisterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 20px;
  background-color: ${props => props.theme === 'dark' ? '#121212' : '#f5f5f5'};
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 30px;
`;

const LogoText = styled.h1`
  font-size: 2em;
  margin-left: 10px;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
`;

const FormCard = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#fff'};
  border-radius: 10px;
  padding: 30px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  font-size: 1.5em;
  margin-bottom: 20px;
  text-align: center;
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  color: ${props => props.theme === 'dark' ? '#ccc' : '#666'};
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#ddd'};
  border-radius: 5px;
  background-color: ${props => props.theme === 'dark' ? '#333' : '#fff'};
  color: ${props => props.theme === 'dark' ? '#f5f5f5' : '#333'};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'dark' ? '#666' : '#ccc'};
  }
`;

const Button = styled.button`
  padding: 12px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  
  &:hover {
    background-color: #3e8e41;
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

const LoginLink = styled.div`
  margin-top: 20px;
  text-align: center;
  color: ${props => props.theme === 'dark' ? '#ccc' : '#666'};
  
  a {
    color: #4caf50;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Register = () => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector(state => state.auth);
  const { theme } = useSelector(state => state.ui);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [passwordError, setPasswordError] = useState('');
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear password error if passwords match
    if (e.target.name === 'confirmPassword' || e.target.name === 'password') {
      if (e.target.name === 'confirmPassword' && formData.password !== e.target.value) {
        setPasswordError('Passwords do not match');
      } else if (e.target.name === 'password' && formData.confirmPassword && formData.confirmPassword !== e.target.value) {
        setPasswordError('Passwords do not match');
      } else {
        setPasswordError('');
      }
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    // Register user
    const { username, email, password } = formData;
    dispatch(register({ username, email, password }));
  };
  
  return (
    <RegisterContainer theme={theme}>
      <Logo>
        <MessageSquare size={40} color="#4caf50" />
        <LogoText theme={theme}>Chat App</LogoText>
      </Logo>
      
      <FormCard theme={theme}>
        <Title theme={theme}>Create an Account</Title>
        
        {error && <ErrorMessage>{error.message}</ErrorMessage>}
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label theme={theme}>Username</Label>
            <Input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              theme={theme}
            />
          </FormGroup>
          
          <FormGroup>
            <Label theme={theme}>Email</Label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              theme={theme}
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
              minLength="6"
              theme={theme}
            />
          </FormGroup>
          
          <FormGroup>
            <Label theme={theme}>Confirm Password</Label>
            <Input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
              theme={theme}
            />
            {passwordError && <ErrorMessage>{passwordError}</ErrorMessage>}
          </FormGroup>
          
          <Button type="submit" disabled={isLoading || passwordError}>
            {isLoading ? 'Creating Account...' : 'Register'}
          </Button>
        </Form>
        
        <LoginLink theme={theme}>
          Already have an account? <Link to="/login">Log In</Link>
        </LoginLink>
      </FormCard>
    </RegisterContainer>
  );
};

export default Register;