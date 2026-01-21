import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, MenuItem, FormControlLabel,
  Switch, Alert, CircularProgress
} from '@mui/material';
import { CUSTOMER_TYPES, ACTION_TYPES, NOTIFICATION_CHANNELS } from '../utils/constants';
import { dunningService } from '../services/dunningService';

const initialRule = {
  rule_name: '',
  customer_type: 'POSTPAID',
  trigger_day: '',
  action_type: 'NOTIFY',
  notification_channel: 'SMS',
  priority: 0,
  is_active: true,
};

const RuleForm = ({ open, onClose, onSuccess, editData }) => {
  const [formData, setFormData] = useState(initialRule);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (editData) {
      setFormData(editData);
    } else {
      setFormData(initialRule);
    }
    setError('');
    setSuccess('');
  }, [editData, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault && e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.rule_name || typeof formData.trigger_day !== "number" && !formData.trigger_day) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    if (+formData.trigger_day < 0 || +formData.trigger_day > 365) {
      setError('Trigger day must be between 0 and 365');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        trigger_day: Number(formData.trigger_day),
        priority: Number(formData.priority),
      };
      if (editData) {
        await dunningService.updateRule(editData.id, payload);
        setSuccess('Rule updated successfully!');
      } else {
        await dunningService.createRule(payload);
        setSuccess('Rule created successfully!');
      }
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editData ? "Edit Dunning Rule" : "Create New Dunning Rule"}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <form onSubmit={handleSubmit} autoComplete="off">
          <Grid container spacing={2} mt={0}>
            <Grid item xs={12}>
              <TextField
                fullWidth required label="Rule Name" name="rule_name"
                value={formData.rule_name} onChange={handleChange}
                placeholder="e.g., Day 5 Reminder - Postpaid"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth required label="Customer Type" name="customer_type"
                value={formData.customer_type} onChange={handleChange}
              >
                {Object.values(CUSTOMER_TYPES).map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth required type="number" label="Trigger Day (Days Overdue)"
                name="trigger_day" value={formData.trigger_day} onChange={handleChange}
                inputProps={{ min: 0, max: 365 }}
                helperText="Days after due date to trigger this rule"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth required label="Action Type" name="action_type"
                value={formData.action_type} onChange={handleChange}
              >
                {Object.values(ACTION_TYPES).map((action) => (
                  <MenuItem key={action} value={action}>{action.replace('_', ' ')}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth required label="Notification Channel" name="notification_channel"
                value={formData.notification_channel} onChange={handleChange}
              >
                {Object.values(NOTIFICATION_CHANNELS).map((channel) => (
                  <MenuItem key={channel} value={channel}>{channel}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth type="number" label="Priority" name="priority"
                value={formData.priority} onChange={handleChange}
                inputProps={{ min: 0 }} helperText="Higher priority rules execute first"
              />
            </Grid>
            <Grid item xs={12} sm={6} display="flex" alignItems="center">
              <FormControlLabel
                control={
                  <Switch checked={formData.is_active}
                          onChange={handleChange} name="is_active" color="primary" />
                }
                label="Rule Active"
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading} variant="contained">
          {loading ? <CircularProgress size={24} /> : (editData ? "Save Changes" : "Create Rule")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RuleForm;
