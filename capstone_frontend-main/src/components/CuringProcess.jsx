import React, { useState, useEffect, useContext } from 'react';
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
  Typography,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton,
  TextField,
  MenuItem,
  Grid,
  Paper,
  Collapse,
} from '@mui/material';
import {
  InfoOutlined,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useSnackbar } from './SnackbarProvider';
import { dunningService } from '../services/dunningService';
import { customerService } from '../services/customerService';
import { useChartColors, useStatusColors } from '../utils/constants';
import { useTheme } from '@mui/material/styles';

const CuringProcess = () => {
  const theme = useTheme();
  const statusColors = useStatusColors();
  const chartColors = useChartColors();
  const { themeMode } = useContext(ThemeModeContext);
  const showSnackbar = useSnackbar();
  const [actions, setActions] = useState([]);
  const [customers, setCustomers] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedId, setExpandedId] = useState(null);
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterSuccess, setFilterSuccess] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [curingActions, allCustomers] = await Promise.all([
        dunningService.getCuringActions(),
        customerService.getAllCustomers({ limit: 1000 }),
      ]);
      setActions(curingActions);
      // Map customerId to customer details
      const custMap = {};
      allCustomers.forEach((c) => {
        custMap[c.id] = c;
      });
      setCustomers(custMap);
    } catch (error) {
      showSnackbar('Failed to load curing process data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value));
    setPage(0);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filtered = actions.filter((action) => {
    const matchesId = filterCustomerId === '' || action.customer_id.toString() === filterCustomerId;
    const matchesSuccess =
      filterSuccess === 'ALL' || (filterSuccess === 'SUCCESS' && action.success_flag) || (filterSuccess === 'FAILED' && !action.success_flag);
    return matchesId && matchesSuccess;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box className="fade-in">
      <Typography 
        variant="h4" 
        fontWeight="bold" 
        mb={3}
        sx={{
          color: themeMode === 'cottonCandy' ? 'secondary.main' : 'error.main',
        }}
      >
        Curing Process Details
      </Typography>

      <Card sx={{ mb: 3 }}>
        <Box p={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Filter by Customer ID"
                value={filterCustomerId}
                onChange={(e) => setFilterCustomerId(e.target.value)}
                size="small"
                fullWidth
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                label="Filter by Success"
                value={filterSuccess}
                onChange={(e) => {
                  setFilterSuccess(e.target.value);
                }}
                size="small"
                fullWidth
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="SUCCESS">Success</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Box>
      </Card>

      <Card elevation={3}>
        <TableContainer component={Paper} sx={{ maxHeight: '65vh' }}>
          <Table stickyHeader aria-label="curing process table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Payment ID</TableCell>
                <TableCell>Previous Status</TableCell>
                <TableCell>New Status</TableCell>
                <TableCell>Actions Taken</TableCell>
                <TableCell>Success</TableCell>
                <TableCell>Cured At</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                    No curing records found.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((action) => {
                  const customer = customers[action.customer_id] || {};
                  return (
                    <React.Fragment key={action.id}>
                      <TableRow hover>
                        <TableCell>{action.id}</TableCell>
                        <TableCell>
                          <Typography fontWeight="bold">{customer.name || 'Unknown'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {action.customer_id}
                          </Typography>
                        </TableCell>
                        <TableCell>{action.payment_id}</TableCell>
                        <TableCell>{action.previous_status}</TableCell>
                        <TableCell>
                          <Chip
                            label={customer.dunning_status || 'N/A'}
                            sx={{
                              backgroundColor: statusColors[customer.dunning_status] || theme.palette.grey[400],
                              color: '#fff',
                              width: 'fit-content'
                            }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{action.action_taken}</TableCell>
                        <TableCell>
                          <Chip
                            label={action.success_flag ? 'Success' : 'Failed'}
                            color={action.success_flag ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{new Date(action.cured_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Tooltip title={expandedId === action.id ? 'Collapse' : 'Expand'}>
                            <IconButton onClick={() => toggleExpand(action.id)} size="small">
                              {expandedId === action.id ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={9} sx={{ py: 0, px: 3 }}>
                          <Collapse in={expandedId === action.id} timeout="auto" unmountOnExit>
                            <Box sx={{ bgcolor: '#f9f9f9', borderRadius: 1, p: 2, mb: 1, fontSize: '0.87rem', fontFamily: '"Courier New", monospace', whiteSpace: 'pre-wrap' }}>
                              <strong>Remarks / More Details:</strong>
                              <br />
                              {action.remarks || 'None'}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          count={filtered.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Card>
    </Box>
  );
};

export default CuringProcess;
