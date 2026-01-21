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
  Chip,
  CircularProgress,
  Typography,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material';
import { dunningService } from '../services/dunningService';
import { CheckCircle, Error, Info } from '@mui/icons-material';

const DunningLogs = () => {
  const { themeMode } = useContext(ThemeModeContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCustomerId) params.customer_id = filterCustomerId;
      const data = await dunningService.getDunningLogs(params);
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = () => {
    setPage(0);
    fetchLogs();
  };

  const filteredLogs = logs.filter((log) => {
    if (filterStatus === 'ALL') return true;
    return log.status === filterStatus;
  });

  const paginatedLogs = filteredLogs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle color="success" />;
      case 'FAILED':
        return <Error color="error" />;
      default:
        return <Info color="info" />;
    }
  };

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
        Dunning Execution Logs
      </Typography>

      <Card elevation={3} sx={{ mb: 3 }}>
        <Box p={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Filter by Customer ID"
                type="number"
                value={filterCustomerId}
                onChange={(e) => setFilterCustomerId(e.target.value)}
                onBlur={handleFilterChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                select
                label="Filter by Status"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(0);
                }}
                size="small"
              >
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="SUCCESS">Success</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="SKIPPED">Skipped</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Box>
      </Card>

      <Card elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Customer</strong></TableCell>
                <TableCell><strong>Rule</strong></TableCell>
                <TableCell><strong>Action Type</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Details</strong></TableCell>
                <TableCell><strong>Timestamp</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{log.id}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {log.customer_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {log.customer_id}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.rule_name || 'N/A'}
                      </Typography>
                    </TableCell>

                    {/* 🎨 Action Type Chip - uses secondary color based on theme */}
                    <TableCell>
                      <Chip
                        label={log.action_type}
                        size="small"
                        variant="outlined"
                        sx={{
                          color: (theme) => theme.palette.secondary.main,
                          borderColor: (theme) => theme.palette.secondary.main,
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getStatusIcon(log.status)}
                        <Chip
                          label={log.status}
                          size="small"
                          color={
                            log.status === 'SUCCESS'
                              ? 'success'
                              : log.status === 'FAILED'
                              ? 'error'
                              : 'default'
                          }
                        />
                      </Box>
                    </TableCell>

                    <TableCell>
                      {log.details && (
                        <Typography variant="caption" sx={{ maxWidth: 200, display: 'block' }}>
                          {log.details.overdue_days && `Overdue: ${log.details.overdue_days} days`}
                          {log.details.notification_sent !== undefined && 
                            `, Notified: ${log.details.notification_sent ? 'Yes' : 'No'}`}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption">
                        {new Date(log.created_at).toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" py={3}>
                      No logs found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredLogs.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>
    </Box>
  );
};

export default DunningLogs;
