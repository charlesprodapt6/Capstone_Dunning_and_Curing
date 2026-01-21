import React, { useState, useRef, useEffect } from 'react';
import {
  Drawer, Box, Typography, IconButton, TextField, List, ListItem, Avatar, Paper,
  CircularProgress, Chip, Button
} from '@mui/material';
import { Send, SmartToy, Person, Close } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const ChatbotSidebar = ({ open, onClose, customerId }) => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Hi! I\'m your AI assistant. Ask me anything about your account status or billing.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      type: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/chatbot/query`, {
        customer_id: parseInt(customerId),
        message: input
      });

      const botMessage = {
        type: 'bot',
        text: response.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'bot',
        text: 'Sorry, I encountered an error. Please try again later or contact support.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Chatbot error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, display: 'flex', flexDirection: 'column' } }}
    >
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" color="secondary.main">AI Assistant</Typography>
        <IconButton onClick={onClose} color="inherit" size="large"><Close /></IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f7f7f7' }}>
        <List>
          {messages.map((msg, i) => (
            <ListItem
              key={i}
              sx={{
                justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                mb: 1
              }}
            >
              <Box sx={{
                display: 'flex',
                flexDirection: msg.type === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: 1,
                maxWidth: '80%',
              }}>
                <Avatar sx={{ bgcolor: msg.type === 'user' ? 'primary.main' : 'secondary.main' }}>
                  {msg.type === 'user' ? <Person /> : <SmartToy />}
                </Avatar>
                <Paper sx={{
                  p: 1.5,
                  bgcolor: msg.type === 'user' ? 'primary.light' : 'white',
                  color: msg.type === 'user' ? 'secondary.main' : 'text.primary'
                }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {msg.text}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Paper>
              </Box>
            </ListItem>
          ))}
          {loading && (
            <ListItem sx={{ justifyContent: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <SmartToy />
                </Avatar>
                <CircularProgress size={20} />
                <Typography variant="caption">Thinking...</Typography>
              </Box>
            </ListItem>
          )}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid #ddd', display: 'flex', gap: 1 }}>
        <TextField
          multiline
          maxRows={3}
          fullWidth
          placeholder="Ask your question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          size="large"
        >
          <Send />
        </IconButton>
      </Box>
    </Drawer>
  );
};

export default ChatbotSidebar;
