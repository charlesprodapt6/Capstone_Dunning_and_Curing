import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid, Alert, CircularProgress
} from '@mui/material';
import { CUSTOMER_TYPES } from '../utils/constants';
import { customerService } from '../services/customerService';

const initialCustomer = {
  name: '',
  email: '',
  phone: '',
  customer_type: 'POSTPAID',
  plan_type: '',
  billing_date: '',
  due_date: '',
  outstanding_amount: 0,
};

const CustomerForm = ({ open, onClose, onSuccess, editData }) => {
  const [form, setForm] = useState(initialCustomer);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editData) {
      setForm(editData);
    } else {
      setForm(initialCustomer);
    }
    setError('');
  }, [editData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "outstanding_amount" ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (!form.name || !form.email || !form.phone || !form.plan_type) {
        setError('All fields marked * are required');
        setLoading(false);
        return;
      }
      const data = {
        ...form,
        outstanding_amount: form.outstanding_amount ? Number(form.outstanding_amount) : 0,
      };
      if (editData) {
        await customerService.updateCustomer(editData.id, data);
      } else {
        await customerService.createCustomer(data);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editData ? "Edit Customer" : "Add New Customer"}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required label="Name" name="name" value={form.name} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required label="Email" name="email" value={form.email} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required label="Phone" name="phone" value={form.phone} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required label="Plan Type" name="plan_type" value={form.plan_type} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select fullWidth label="Customer Type" name="customer_type"
              value={form.customer_type} onChange={handleChange}
            >
              {Object.values(CUSTOMER_TYPES).map(type =>
                <MenuItem key={type} value={type}>{type}</MenuItem>
              )}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              type="number"
              fullWidth label="Outstanding Amount" name="outstanding_amount"
              value={form.outstanding_amount} onChange={handleChange} inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth type="date" label="Billing Date" name="billing_date"
              value={form.billing_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth type="date" label="Due Date" name="due_date"
              value={form.due_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading} variant="contained">
          {loading ? <CircularProgress size={24} /> : (editData ? "Save Changes" : "Add Customer")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerForm;
