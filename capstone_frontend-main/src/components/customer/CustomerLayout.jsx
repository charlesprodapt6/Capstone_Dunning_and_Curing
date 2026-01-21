import React, { useState, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem
} from '@mui/material';
import { Logout, AccountCircle } from '@mui/icons-material';
import { ThemeModeContext } from '../../main';
import Tooltip from '@mui/material/Tooltip';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import Brightness2Icon from '@mui/icons-material/Brightness2';

const CustomerLayout = ({ onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Customer';
  const { themeMode, toggleTheme } = useContext(ThemeModeContext);

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileClose();
    onLogout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ backgroundColor: 'primary.main' }}>
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              color: themeMode === 'cottonCandy' ? 'secondary.main' : 'error.main',
            }}
          >
            Dunning & Curing - Customer Portal
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title={`Switch to ${themeMode === 'cottonCandy' ? 'Samurai' : 'Cotton Candy'} theme`}>
              <IconButton 
                onClick={toggleTheme} 
                sx={{
                  backgroundColor: 'white',
                  color: themeMode === 'cottonCandy' ? 'secondary.main' : 'error.main',
                  '&:hover': {
                    backgroundColor: themeMode === 'cottonCandy' ? 'secondary.light' : 'error.light',
                    color: 'white',
                  },
                }}
              >
                {themeMode === 'cottonCandy' ? <WbSunnyIcon /> : <Brightness2Icon />}
              </IconButton>
            </Tooltip>
            <Typography variant="body2">{userName}</Typography>
            <IconButton 
              onClick={handleProfileClick}
              sx={{
                backgroundColor: 'white',
                color: 'secondary.main',
                '&:hover': {
                  backgroundColor: 'secondary.light',
                  color: 'white',
                },
              }}
            >
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main' }}>
                {userName.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>

          <Menu 
            anchorEl={anchorEl} 
            open={Boolean(anchorEl)} 
            onClose={handleProfileClose}
            PaperProps={{
              sx: {
                '& .MuiMenuItem-root': {
                  backgroundColor: 'white',
                  color: 'secondary.main',
                  '&:hover': {
                    backgroundColor: 'secondary.light',
                    color: 'white',
                  },
                },
              },
            }}
          >
            <MenuItem onClick={handleProfileClose}>
              <AccountCircle sx={{ mr: 2 }} /> Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 2 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f5f5f5' }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default CustomerLayout;
