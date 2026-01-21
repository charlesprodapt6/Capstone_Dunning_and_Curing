import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseIcon from '@mui/icons-material/Close';
import { dunningService } from '../services/dunningService';
import { useSnackbar } from './SnackbarProvider';

const NotifyCustomerJSON = () => {
  const [open, setOpen] = useState(false);
  const [jsonData, setJsonData] = useState('');
  const [loading, setLoading] = useState(false);
  const showSnackbar = useSnackbar();

  const handleOpen = async () => {
    setLoading(true);
    try {
      const overdueCustomers = await dunningService.getOverdueCustomers();
      // Filter customers with dunning_status NOTIFIED or similar (customize as needed)
      const toNotify = overdueCustomers.filter(c => c.dunning_status === 'NOTIFIED');

      const pretty = JSON.stringify(toNotify, null, 2);
      setJsonData(pretty);
      setOpen(true);
    } catch (error) {
      showSnackbar('Failed to fetch customers to notify', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonData);
    showSnackbar('JSON copied to clipboard', 'success');
  };

  const handleDownload = () => {
    const blob = new Blob([jsonData], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers_to_notify_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Show Customers to Notify (JSON)'}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Customers to Notify (JSON)</Typography>
          <Box>
            <Tooltip title="Download JSON">
              <IconButton onClick={handleDownload}>
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy to clipboard">
              <IconButton onClick={handleCopy}>
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={() => setOpen(false)}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box
            component="pre"
            sx={{
              bgcolor: "#272822",
              color: "#f8f8f2",
              borderRadius: 1,
              p: 2,
              overflowX: "auto",
              fontSize: "0.9rem",
              maxHeight: "60vh",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            {jsonData || "No customer data to display"}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotifyCustomerJSON;
