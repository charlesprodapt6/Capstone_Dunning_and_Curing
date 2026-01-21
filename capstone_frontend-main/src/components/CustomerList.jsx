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
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Typography,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Search, Visibility, Edit, Delete, Add } from '@mui/icons-material';
import { customerService } from '../services/customerService';
import { CUSTOMER_TYPES, DUNNING_STATUS, useStatusColors } from '../utils/constants';
import CustomerForm from './CustomerForm';
import { useSnackbar } from './SnackbarProvider';

const CustomerList = () => {
  const navigate = useNavigate();
  const showSnackbar = useSnackbar();
  const statusColors = useStatusColors();
  const { themeMode } = useContext(ThemeModeContext);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerService.getAllCustomers({ limit: 1000 });
      setCustomers(data);
    } catch (error) {
      showSnackbar('Error fetching customers', 'error');
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

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value));
    setPage(0);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerService.deleteCustomer(id);
        showSnackbar('Customer deleted', 'success');
        fetchCustomers();
      } catch {
        showSnackbar('Delete failed', 'error');
      }
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || customer.customer_type === filterType;
    const matchesStatus = filterStatus === 'ALL' || customer.dunning_status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const paginatedCustomers = filteredCustomers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
          Customers
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenForm()}
        >
          Add Customer
        </Button>
      </Box>

      <Card elevation={3}>
        <Box p={3}>
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <TextField
              placeholder="Search customers..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Customer Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Customer Type"
              >
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value="POSTPAID">Postpaid</MenuItem>
                <MenuItem value="PREPAID">Prepaid</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="ALL">All Status</MenuItem>
                {Object.keys(DUNNING_STATUS).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Outstanding</strong></TableCell>
                  <TableCell><strong>Overdue Days</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCustomers.length > 0 ? (
                  paginatedCustomers.map((customer) => (
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
                      <TableCell>₹{parseFloat(customer.outstanding_amount).toFixed(2)}</TableCell>
                      <TableCell>
                        {customer.overdue_days > 0 ? (
                          <Chip
                            label={`${customer.overdue_days} days`}
                            size="small"
                            color="warning"
                          />
                        ) : '0 days'}
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
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/customers/${customer.id}`)}
                            sx={{ color: 'black' }} // 👈 Force black icon color
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleOpenForm(customer)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(customer.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary" py={3}>
                        No customers found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredCustomers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Box>
      </Card>

      <CustomerForm
        open={formOpen}
        onClose={handleCloseForm}
        onSuccess={fetchCustomers}
        editData={editData}
      />
    </Box>
  );
};

export default CustomerList;
