import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeModeContext } from '../main';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Typography,
  Button,
  Alert,
  TableSortLabel,
} from '@mui/material';
import { Visibility, PlayArrow, Warning } from '@mui/icons-material';
import { dunningService } from '../services/dunningService';
import { useStatusColors } from '../utils/constants';

const OverdueCustomers = () => {
  const navigate = useNavigate();
  const statusColors = useStatusColors();
  const { themeMode } = useContext(ThemeModeContext);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [orderBy, setOrderBy] = useState('overdue_days');
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    fetchOverdueCustomers();
  }, []);

  const fetchOverdueCustomers = async () => {
    setLoading(true);
    try {
      const data = await dunningService.getOverdueCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching overdue customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerDunning = async (customerId = null) => {
    setExecuting(true);
    setResult(null);
    try {
      if (customerId) {
        const res = await dunningService.triggerDunningSingle(customerId);
        setResult({ success: true, message: `Dunning triggered for customer ${customerId}`, data: res });
      } else {
        const res = await dunningService.triggerDunningAll();
        setResult({ success: true, message: 'Dunning triggered for all overdue customers', data: res });
      }
      fetchOverdueCustomers();
    } catch (error) {
      console.error('Error triggering dunning:', error);
      setResult({ success: false, message: 'Failed to trigger dunning' });
    } finally {
      setExecuting(false);
    }
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    if (orderBy === 'overdue_days') {
      return order === 'asc' ? a.overdue_days - b.overdue_days : b.overdue_days - a.overdue_days;
    }
    if (orderBy === 'outstanding_amount') {
      return order === 'asc' ? a.outstanding_amount - b.outstanding_amount : b.outstanding_amount - a.outstanding_amount;
    }
    return 0;
  });

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box className="fade-in">
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography 
          variant="h4" 
          fontWeight="bold"
          sx={{
            color: themeMode === 'cottonCandy' ? 'secondary.main' : 'error.main',
          }}
        >
          Overdue Customers
        </Typography>
        <Button
          variant="contained"
          startIcon={executing ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
          onClick={() => handleTriggerDunning()}
          disabled={executing || customers.length === 0}
          color="error"
        >
          {executing ? 'Executing...' : 'Trigger All'}
        </Button>
      </Box>

      {result && (
        <Alert
          severity={result.success ? 'success' : 'error'}
          sx={{ mb: 3 }}
          onClose={() => setResult(null)}
        >
          {result.message}
          {result.data && (
            <Typography variant="caption" display="block" mt={1}>
              Processed: {result.data.total_customers} | Success: {result.data.successful}
            </Typography>
          )}
        </Alert>
      )}

      {customers.length === 0 ? (
        <Card elevation={3}>
          <Box p={5} textAlign="center">
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No overdue customers found! 🎉
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All customers are up to date with their payments.
            </Typography>
          </Box>
        </Card>
      ) : (
        <Card elevation={3}>
          <Box p={2} bgcolor="warning.light" display="flex" alignItems="center" gap={1}>
            <Warning color="warning" />
            <Typography variant="body2" fontWeight="bold">
              {customers.length} customer{customers.length > 1 ? 's' : ''} with overdue payments
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'outstanding_amount'}
                      direction={orderBy === 'outstanding_amount' ? order : 'asc'}
                      onClick={() => handleSort('outstanding_amount')}
                    >
                      <strong>Outstanding</strong>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'overdue_days'}
                      direction={orderBy === 'overdue_days' ? order : 'asc'}
                      onClick={() => handleSort('overdue_days')}
                    >
                      <strong>Overdue Days</strong>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedCustomers.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>{customer.id}</TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={customer.customer_type}
                        size="small"
                        color={customer.customer_type === 'POSTPAID' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold" color="error.main">
                        ₹{parseFloat(customer.outstanding_amount).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${customer.overdue_days} days`}
                        size="small"
                        color={
                          customer.overdue_days > 20 ? 'error' :
                          customer.overdue_days > 10 ? 'warning' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={customer.dunning_status}
                        size="small"
                        sx={{
                          backgroundColor: statusColors[customer.dunning_status] || statusColors.ACTIVE,
                          color: 'white',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {/* 👁️ View Details icon stays black in both themes */}
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          sx={{ color: '#000' }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>

                      {/* 🔴 Trigger Dunning button stays error color */}
                      <Tooltip title="Trigger Dunning">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleTriggerDunning(customer.id)}
                          disabled={executing}
                        >
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
};

export default OverdueCustomers;
