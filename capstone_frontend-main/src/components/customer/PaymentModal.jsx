import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, Alert, CircularProgress, MenuItem, Typography, Box
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const PaymentModal = ({ open, onClose, onSuccess, customerId, outstandingAmount }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    if (parseFloat(amount) > outstandingAmount) {
      setError(`Amount cannot exceed outstanding balance of ₹${outstandingAmount.toFixed(2)}`);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/customer-portal/make-payment`, {
        customer_id: parseInt(customerId),
        amount: parseFloat(amount),
        payment_method: paymentMethod,
      });

      if (response.data.success) {
        setSuccess('Payment processed successfully!');
        setTimeout(() => {
          onSuccess();
          setAmount('');
          setError('');
          setSuccess('');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Make Payment</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box mb={2} mt={1}>
          <Typography variant="body2" color="text.secondary">Outstanding Balance</Typography>
          <Typography variant="h5" fontWeight="bold" color="error.main">
            ₹{outstandingAmount.toFixed(2)}
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Payment Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputProps={{ min: 0, max: outstandingAmount, step: 0.01 }}
              helperText={`Maximum: ₹${outstandingAmount.toFixed(2)}`}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <MenuItem value="UPI">UPI</MenuItem>
              <MenuItem value="CARD">Credit/Debit Card</MenuItem>
              <MenuItem value="NETBANKING">Net Banking</MenuItem>
              <MenuItem value="WALLET">Wallet</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || success} variant="contained">
          {loading ? <CircularProgress size={24} /> : 'Pay Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentModal;
