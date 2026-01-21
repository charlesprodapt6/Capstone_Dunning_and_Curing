import React, { useState, useEffect, useContext } from 'react';
import { ThemeModeContext } from '../../main';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Button,
  CircularProgress, Alert, Divider
} from '@mui/material';
import { Fab } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { Payment as PaymentIcon } from '@mui/icons-material';
import axios from 'axios';
import PaymentModal from './PaymentModal';
import ChatbotSidebar from './ChatbotSidebar';
import { useTheme } from '@mui/material/styles';
import { useStatusColors } from '../../utils/constants';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const CustomerDashboard = () => {
  const theme = useTheme();
  const statusColors = useStatusColors();
  const { themeMode } = useContext(ThemeModeContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const customerId = localStorage.getItem('userId') || 1; // Fallback if needed

  const loadProfile = () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('Please login again');
      setLoading(false);
      return;
    }

    axios
      .get(`${API_BASE_URL}/api/v1/customer-portal/profile/${userId}`)
      .then((res) => {
        setData(res.data);
        setError(null);
      })
      .catch((err) => {
        setError('Failed to load profile');
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) return <Box p={5} textAlign="center"><CircularProgress /></Box>;
  if (error) return <Box p={3}><Alert severity="error">{error}</Alert></Box>;
  if (!data) return <Box p={3}><Alert severity="warning">No data</Alert></Box>;

  const { customer } = data;

  return (
    <Box p={3}>
      <Typography 
        variant="h4" 
        mb={3}
        sx={{
          color: themeMode === 'cottonCandy' ? 'secondary.main' : 'error.main',
        }}
      >
        Welcome, {customer.name}!
      </Typography>

      {customer.overdue_days > 0 && (
        <Alert severity={customer.overdue_days > 0 ? 'error' : 'success'} sx={{ mb: 2 }}>
          Payment overdue by {customer.overdue_days} days
        </Alert>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Outstanding</Typography>
              <Typography variant="h4" sx={{ color: theme.palette.error.main }}>₹{customer.outstanding_amount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Overdue Days</Typography>
              <Typography variant="h4">{customer.overdue_days}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Status</Typography>
              <Chip
                label={customer.dunning_status}
                sx={{
                  mt: 1,
                  bgcolor: statusColors[customer.dunning_status],
                  color: 'white',
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {customer.outstanding_amount > 0 && (
        <Box textAlign="center" my={3}>
          <Button
            variant="contained"
            size="large"
            startIcon={<PaymentIcon />}
            onClick={() => setModalOpen(true)}
          >
            Make Payment
          </Button>
        </Box>
      )}

      <Card>
        <CardContent>
          <Typography 
            variant="h6" 
            mb={2}
            sx={{
              color: themeMode === 'cottonCandy' ? 'secondary.main' : 'error.main',
            }}
          >
            Account Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}><Typography variant="caption">Plan</Typography></Grid>
            <Grid item xs={6}><Typography>{customer.plan_type}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption">Type</Typography></Grid>
            <Grid item xs={6}><Chip label={customer.customer_type} size="small" /></Grid>
          </Grid>
        </CardContent>
      </Card>

      <PaymentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          loadProfile();
        }}
        customerId={customer.id}
        outstandingAmount={customer.outstanding_amount}
      />
      {/* AI Chatbot */}
<Card elevation={3} sx={{ mt: 3 }}>
  <Fab
      color="primary"
      onClick={() => setChatOpen(true)}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: theme => theme.zIndex.modal + 1,
      }}
      aria-label="chatbot"
    >
      <ChatIcon />
    </Fab>

    {/* Chatbot Sidebar */}
    <ChatbotSidebar
      open={chatOpen}
      onClose={() => setChatOpen(false)}
      customerId={customerId}
    />
</Card>
    </Box>
  );
};

export default CustomerDashboard;
