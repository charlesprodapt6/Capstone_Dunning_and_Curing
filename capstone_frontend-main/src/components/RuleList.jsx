// Similar improvements as in CustomerList, but using RuleForm for add/edit logic

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeModeContext } from '../main';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip, CircularProgress, Typography, Button, Switch
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { dunningService } from '../services/dunningService';
import RuleForm from './RuleForm';
import { useSnackbar } from './SnackbarProvider';

const RuleList = () => {
  const navigate = useNavigate();
  const showSnackbar = useSnackbar();
  const { themeMode } = useContext(ThemeModeContext);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await dunningService.getAllRules();
      setRules(data);
    } catch (error) {
      showSnackbar('Error fetching rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (data = null) => {
    setEditData(data);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditData(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await dunningService.deleteRule(id);
        showSnackbar('Rule deleted', 'success');
        fetchRules();
      } catch {
        showSnackbar('Delete failed', 'error');
      }
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await dunningService.updateRule(id, { is_active: !isActive });
      showSnackbar('Updated status', 'success');
      fetchRules();
    } catch (error) {
      showSnackbar('Status update failed', 'error');
    }
  };

  if (loading) {
    return <Box className="loading-container"><CircularProgress size={60} /></Box>;
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
          Dunning Rules
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenForm()}>
          Add New Rule
        </Button>
      </Box>
      <Card elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Rule Name</strong></TableCell>
                <TableCell><strong>Customer Type</strong></TableCell>
                <TableCell><strong>Trigger Day</strong></TableCell>
                <TableCell><strong>Action</strong></TableCell>
                <TableCell><strong>Channel</strong></TableCell>
                <TableCell><strong>Priority</strong></TableCell>
                <TableCell><strong>Active</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.length > 0 ? (
                rules.map((rule) => (
                  <TableRow key={rule.id} hover>
                    <TableCell>{rule.id}</TableCell>
                    <TableCell>{rule.rule_name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={rule.customer_type} 
                        size="small" 
                        color={
                          rule.customer_type === 'POSTPAID'
                            ? 'primary'
                            : rule.customer_type === 'PREPAID'
                            ? 'secondary'
                            : 'default'
                        } 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={`Day ${rule.trigger_day}`} size="small" color="warning" />
                    </TableCell>
                    <TableCell>
                      <Chip label={rule.action_type.replace('_', ' ')} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={rule.notification_channel} size="small" />
                    </TableCell>
                    <TableCell>{rule.priority}</TableCell>
                    <TableCell>
                      <Switch 
                        checked={rule.is_active} 
                        onChange={() => handleToggleActive(rule.id, rule.is_active)} 
                        color="success" 
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenForm(rule)}
                          sx={{
                            color: themeMode === 'cottonCandy' ? '#e91e63' : '#000000',
                          }}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary" py={3}>
                      No rules found. Create your first dunning rule!
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      <RuleForm
        open={formOpen}
        onClose={handleCloseForm}
        onSuccess={fetchRules}
        editData={editData}
      />
    </Box>
  );
};

export default RuleList;
