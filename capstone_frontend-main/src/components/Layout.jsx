import React, { useState, useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Fab,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Rule,
  Warning,
  History,
  Logout,
  AccountCircle,
  InfoOutlined,
} from '@mui/icons-material';
import ChatIcon from '@mui/icons-material/Chat';
import { ThemeModeContext } from '../main';
import ChatbotSidebar from './customer/ChatbotSidebar';

// Image toggles
import helloKittyImg from '../assets/hello-kitty.png';
import oniSamuraiImg from '../assets/oni-samurai.jpg';

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Customers', icon: <People />, path: '/customers' },
  { text: 'Dunning Rules', icon: <Rule />, path: '/rules' },
  { text: 'Overdue Customers', icon: <Warning />, path: '/overdue' },
  { text: 'Dunning Logs', icon: <History />, path: '/logs' },
  { text: 'Curing Process', icon: <InfoOutlined />, path: '/curing/process' },
];

const Layout = ({ onLogout }) => {
  const { themeMode, toggleTheme } = useContext(ThemeModeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem('username') || 'Admin';
  const customerId = localStorage.getItem('userId') || 1;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuClick = (path) => {
    navigate(path);
    setMobileOpen(false);
  };
  const handleProfileClick = (event) => setAnchorEl(event.currentTarget);
  const handleProfileClose = () => setAnchorEl(null);
  const handleLogout = () => {
    handleProfileClose();
    onLogout();
  };

  const drawer = (
    <Box
      sx={{
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        borderRight: '1px solid rgba(255,255,255,0.3)',
        height: '100%',
      }}
    >
      <Box
        sx={{
          p: 3,
          background:
            themeMode === 'cottonCandy'
              ? 'linear-gradient(135deg, rgba(255,105,180,0.9) 0%, rgba(255,166,201,0.9) 100%)'
              : 'linear-gradient(135deg, rgba(198,40,40,0.9) 0%, rgba(17,17,17,0.9) 100%)',
          color: 'white',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Dunning & Curing
        </Typography>
        <Typography variant="caption">Management System</Typography>
      </Box>

      <Divider />

      <List sx={{ px: 2, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleMenuClick(item.path)}
              sx={{
                borderRadius: 2,
                backgroundColor: 'white',
                color:
                  themeMode === 'samurai'
                    ? 'error.main'
                    : 'secondary.main',
                '&:hover': {
                  backgroundColor:
                    themeMode === 'samurai'
                      ? 'error.main'
                      : 'secondary.light',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&.Mui-selected': {
                  backgroundColor:
                    themeMode === 'samurai'
                      ? 'error.main'
                      : 'secondary.light',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '& .MuiListItemIcon-root': {
                  color:
                    location.pathname === item.path
                      ? 'white'
                      : themeMode === 'samurai'
                      ? 'error.main'
                      : 'secondary.main',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255,255,255,0.8)',
          color:
            themeMode === 'samurai'
              ? 'error.main'
              : 'secondary.main',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            sx={{
              flexGrow: 1,
              fontWeight: 'bold',
              color:
                themeMode === 'samurai'
                  ? 'error.main'
                  : 'secondary.main',
            }}
          >
            {menuItems.find((i) => i.path === location.pathname)?.text ||
              'Dashboard'}
          </Typography>

          {/* Image-based toggle button */}
          <Tooltip
            title={`Switch to ${
              themeMode === 'cottonCandy'
                ? 'Samurai'
                : 'Cotton Candy'
            } theme`}
          >
            <IconButton
              onClick={toggleTheme}
              sx={{
                mr: 3,
                backgroundColor: '#fff0f6',
                borderRadius: '50%',
                width: 48,
                height: 48,
                p: 0,
                '&:hover': { backgroundColor: '#ffe4ee' },
              }}
            >
              <img
                src={
                  themeMode === 'cottonCandy'
                    ? helloKittyImg
                    : oniSamuraiImg
                }
                alt="theme toggle"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            </IconButton>
          </Tooltip>

          <Typography
            variant="body2"
            sx={{ display: { xs: 'none', sm: 'block' }, mr: 1 }}
          >
            {username}
          </Typography>

          <IconButton onClick={handleProfileClick}>
            <Avatar
              sx={{
                bgcolor:
                  themeMode === 'samurai'
                    ? 'error.main'
                    : 'secondary.main',
              }}
            >
              {username.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileClose}
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

      {/* Chat button */}
      <Fab
        color="primary"
        onClick={() => setChatOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: (theme) => theme.zIndex.modal + 1,
          backgroundColor:
            themeMode === 'samurai'
              ? 'error.main'
              : 'secondary.main',
          '&:hover': {
            backgroundColor:
              themeMode === 'samurai'
                ? 'error.dark'
                : 'secondary.dark',
          },
        }}
        aria-label="chatbot"
      >
        <ChatIcon />
      </Fab>

      <ChatbotSidebar
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        customerId={customerId}
      />

      {/* Drawer + Main */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          minHeight: '100vh',
          backgroundColor: 'white',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
