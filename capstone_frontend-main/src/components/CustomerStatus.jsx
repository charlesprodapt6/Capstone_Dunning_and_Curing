import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThemeModeContext } from '../main';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Email,
  Phone,
  CreditCard,
  CalendarToday,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { customerService } from '../services/customerService';
import { useStatusColors } from '../utils/constants';

const CustomerStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { themeMode } = useContext(ThemeModeContext);
  const [customer, setCustomer] = useState(null);
  const [customerStatus, setCustomerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const statusColors = useStatusColors();

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const [customerData, statusData] = await Promise.all([
        customerService.getCustomerById(id),
        customerService.getCustomerStatus(id),
      ]);
      setCustomer(customerData);
      setCustomerStatus(statusData);
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!customer || !customerStatus) {
    return (
      <Alert severity="error">Customer not found</Alert>
    );
  }

  return (
    <Box className="fade-in">
      <Box mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/customers')}
          sx={{ mb: 2 }}
        >
          Back to Customers
        </Button>
        <Typography 
          variant="h4" 
          fontWeight="bold"
          sx={{
            color: themeMode === 'cottonCandy' ? 'secondary.main' : 'error.main',
          }}
        >
          Customer Details
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Customer Information */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                gutterBottom
                sx={{
                  color: themeMode === 'cottonCandy' ? 'secondary.main' : 'error.main',
                }}
              >
                Personal Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <List>
                <ListItem>
                  <Person sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText
                    primary="Name"
                    secondary={customer.name}
                  />
                </ListItem>
                <ListItem>
                  <Email sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText
                    primary="Email"
                    secondary={customer.email}
                  />
                </ListItem>
                <ListItem>
                  <Phone sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText
                    primary="Phone"
                    secondary={customer.phone}
                  />
                </ListItem>
                <ListItem>
                  <CreditCard sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText
                    primary="Plan Type"
                    secondary={customer.plan_type}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Customer Type"
                    secondary={
                      <Chip
                        label={customer.customer_type}
                        size="small"
                        color={customer.customer_type === 'POSTPAID' ? 'primary' : 'secondary'}
                      />
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Billing Information */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                gutterBottom
                sx={{
                  color: themeMode === 'cottonCandy' ? 'secondary.main' : 'error.main',
                }}
              >
                Billing Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <List>
                <ListItem>
                  <ListItemText
                    primary="Outstanding Amount"
                    secondary={
                      <Typography variant="h5" color="error" fontWeight="bold">
                        ₹{parseFloat(customer.outstanding_amount).toFixed(2)}
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem>
                  <Warning sx={{ mr: 2, color: 'warning.main' }} />
                  <ListItemText
                    primary="Overdue Days"
                    secondary={
                      <Chip
                        label={`${customer.overdue_days} days`}
                        color={customer.overdue_days > 0 ? 'error' : 'success'}
                        size="small"
                      />
                    }
                  />
                </ListItem>
                <ListItem>
                  <CalendarToday sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText
                    primary="Due Date"
                    secondary={customer.due_date || 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <CalendarToday sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText
                    primary="Billing Date"
                    secondary={customer.billing_date || 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Dunning Status"
                    secondary={
                      <Chip
                        label={customer.dunning_status}
                        sx={{
                          backgroundColor: statusColors[customer.dunning_status],
                          color: 'white',
                        }}
                      />
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Statistics */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                gutterBottom
                sx={{
                  color: themeMode === 'cottonCandy' ? 'secondary.main' : 'error.main',
                }}
              >
                Account Summary
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} sx={{ backgroundColor: '#e3f2fd', borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {customerStatus.total_payments || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Payments
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} sx={{ backgroundColor: '#fff3e0', borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      {customerStatus.total_notifications || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Notifications Sent
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} sx={{ backgroundColor: '#e8f5e9', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Last Payment
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {customerStatus.last_payment_date
                        ? new Date(customerStatus.last_payment_date).toLocaleDateString()
                        : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} sx={{ backgroundColor: '#fce4ec', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Account Status
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {customer.overdue_days === 0 ? (
                        <Chip icon={<CheckCircle />} label="Current" color="success" size="small" />
                      ) : (
                        <Chip icon={<Warning />} label="Overdue" color="error" size="small" />
                      )}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerStatus;
