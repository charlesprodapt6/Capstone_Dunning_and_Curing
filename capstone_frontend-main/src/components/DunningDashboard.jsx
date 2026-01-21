import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Button,
  Alert,
} from '@mui/material';
import {
  People,
  Warning,
  CheckCircle,
  Block,
  PlayArrow,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { customerService } from "../services/customerService";
import { dunningService } from "../services/dunningService";
import NotifyCustomerJSON from './NotifyCustomerJSON';
import { useChartColors, useStatusColors } from '../utils/constants';
import { useTheme } from '@mui/material/styles';
import { ThemeModeContext } from '../main';

const StatCard = ({ title, value, icon, color, subtitle }) => {
  const { themeMode } = useContext(ThemeModeContext);

  // dynamic color logic based on theme
  const cardColor = themeMode === 'cottonCandy' ? '#ff69b4' : '#111';
  const iconColor = cardColor;

  return (
    <Card
      elevation={3}
      sx={{
        height: '100%',
        borderLeft: `4px solid ${cardColor}`,
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                color: themeMode === 'cottonCandy' ? 'secondary.main' : 'error.main',
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${cardColor}20`,
              borderRadius: '50%',
              p: 2,
              display: 'flex',
            }}
          >
            {React.cloneElement(icon, { sx: { fontSize: 40, color: iconColor } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const DunningDashboard = () => {
  const theme = useTheme();
  const chartColors = useChartColors();
  const statusColors = useStatusColors();
  const { themeMode } = useContext(ThemeModeContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    overdueCustomers: 0,
    activeCustomers: 0,
    barredCustomers: 0,
  });
  const [statusData, setStatusData] = useState([]);
  const [overdueData, setOverdueData] = useState([]);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [customers, overdueCustomers] = await Promise.all([
        customerService.getAllCustomers({ limit: 1000 }),
        dunningService.getOverdueCustomers(),
      ]);

      const statusCounts = customers.reduce((acc, customer) => {
        acc[customer.dunning_status] = (acc[customer.dunning_status] || 0) + 1;
        return acc;
      }, {});

      setStats({
        totalCustomers: customers.length,
        overdueCustomers: overdueCustomers.length,
        activeCustomers: statusCounts.ACTIVE || 0,
        barredCustomers: statusCounts.BARRED || 0,
      });

      const statusChartData = Object.keys(statusCounts).map((status) => ({
        name: status,
        value: statusCounts[status],
      }));

      setStatusData(statusChartData);

      const overdueBuckets = {
        '0-5 days': 0,
        '6-10 days': 0,
        '11-15 days': 0,
        '16-20 days': 0,
        '20+ days': 0,
      };

      overdueCustomers.forEach((customer) => {
        const days = customer.overdue_days;
        if (days <= 5) overdueBuckets['0-5 days']++;
        else if (days <= 10) overdueBuckets['6-10 days']++;
        else if (days <= 15) overdueBuckets['11-15 days']++;
        else if (days <= 20) overdueBuckets['16-20 days']++;
        else overdueBuckets['20+ days']++;
      });

      const overdueChartData = Object.keys(overdueBuckets).map((bucket) => ({
        name: bucket,
        count: overdueBuckets[bucket],
      }));

      setOverdueData(overdueChartData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerDunning = async () => {
    setExecuting(true);
    setExecutionResult(null);
    try {
      const result = await dunningService.triggerDunningAll();
      setExecutionResult(result);
      fetchDashboardData();
    } catch (error) {
      console.error('Error triggering dunning:', error);
      setExecutionResult({ error: 'Failed to execute dunning process' });
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Define pie chart color schemes
  const pieColors =
    themeMode === 'cottonCandy'
      ? ['#FFC0CB', '#FFB6C1', '#FF69B4', '#FF1493', '#DB7093'] // pinks
      : ['#FF4C4C', '#E60000', '#B22222', '#8B0000', '#A52A2A']; // reds

  // Match button color with sidebar theme
  const buttonColor = themeMode === 'cottonCandy' ? '#FF69B4' : '#B22222';
  const buttonHoverColor = themeMode === 'cottonCandy' ? '#FF1493' : '#8B0000';

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
          Dashboard Overview
        </Typography>

        {/* Trigger Dunning Button */}
        <Button
          variant="contained"
          size="large"
          startIcon={executing ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
          onClick={handleTriggerDunning}
          disabled={executing}
          sx={{
            backgroundColor: buttonColor,
            color: '#fff',
            fontWeight: 'bold',
            '&:hover': { backgroundColor: buttonHoverColor },
          }}
        >
          {executing ? 'Executing...' : 'Trigger Dunning'}
        </Button>
      </Box>

      {executionResult && (
        <Alert
          severity={executionResult.error ? 'error' : 'success'}
          sx={{ mb: 3 }}
          onClose={() => setExecutionResult(null)}
        >
          {executionResult.error ? (
            executionResult.error
          ) : (
            <Box>
              <Typography variant="body2" fontWeight="bold">
                Dunning executed successfully!
              </Typography>
              <Typography variant="caption">
                Processed: {executionResult.total_customers} | Success: {executionResult.successful} | 
                Failed: {executionResult.failed} | Skipped: {executionResult.skipped}
              </Typography>
            </Box>
          )}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={<People />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue Customers"
            value={stats.overdueCustomers}
            icon={<Warning />}
            subtitle="Requires attention"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Customers"
            value={stats.activeCustomers}
            icon={<CheckCircle />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Barred Customers"
            value={stats.barredCustomers}
            icon={<Block />}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
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
                Customer Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

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
                Overdue Days Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={overdueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={pieColors[0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Centered Notify Button Section */}
      <Box display="flex" justifyContent="center" mt={5}>
        <Box sx={{ textAlign: 'center', backgroundColor: 'transparent' }}>
          <NotifyCustomerJSON
            buttonStyle={{
              backgroundColor: buttonColor,
              color: '#fff',
              fontWeight: 'bold',
              padding: '10px 24px',
              '&:hover': { backgroundColor: buttonHoverColor },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default DunningDashboard;
