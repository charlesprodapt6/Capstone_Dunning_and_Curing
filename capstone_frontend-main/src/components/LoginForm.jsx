import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Container, Alert, InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, AccountCircle, Lock } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000';

const LoginForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter email and password');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login...', email);
      
      const response = await axios.post(`${API_BASE_URL}/api/v1/customer-portal/login`, {
        email: email.trim(),
        password: password.trim()
      });

      console.log('Login response:', response.data);

      if (response.data.success && response.data.user) {
        const user = response.data.user;
        
        // Store authentication data
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('userId', user.id.toString());
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('token', user.token);
        
        console.log('Login successful, redirecting to:', user.role);
        
        // Navigate based on role
        if (user.role === 'ADMIN') {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/customer/dashboard', { replace: true });
        }
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      background: 'linear-gradient(135deg, #ffb6c1 0%, #ffc0cb 50%, #dda0dd 100%)' 
    }}>
      <Container maxWidth="sm">
        <Card elevation={10} sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 5 }}>
            <Box textAlign="center" mb={4}>
              <Typography variant="h4" fontWeight="bold" color="secondary.main" gutterBottom>
                Dunning & Curing System
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please login to continue
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircle color="action" />
                    </InputAdornment>
                  )
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>

              <Box textAlign="center" mt={2}>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  <strong>Admin Login:</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Email: admin@dunning.com
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Password: admin123
                </Typography>
                
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  <strong>Customer Login:</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Use your email and phone number
                </Typography>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginForm;
