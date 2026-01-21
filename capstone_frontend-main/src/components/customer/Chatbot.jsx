import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  Box, Paper, TextField, IconButton, Typography, CircularProgress,
  List, ListItem, Avatar, Chip
} from '@mui/material';
import { Send, SmartToy, Person } from '@mui/icons-material';
import axios from 'axios';
import { ThemeModeContext } from '../main'; // to get theme mode dynamically

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const Chatbot = ({ customerId }) => {
  const { themeMode } = useContext(ThemeModeContext);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Hi! I'm your AI assistant. Ask me anything about your account status, restrictions, or billing.",
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
    scrollToBottom();
  }, [messages]);

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
        text: 'Sorry, I encountered an error. Please try again or contact support.',
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

  const quickQuestions = [
    "Why is my service restricted?",
    "When is my payment due?",
    "How much do I owe?",
    "How to restore my service?"
  ];

  const handleQuickQuestion = (question) => {
    setInput(question);
  };

  return (
    <Paper elevation={3} sx={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          color: 'secondary.main',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        <SmartToy />
        <Typography variant="h6" fontWeight="bold">AI Assistant</Typography>
        <Chip
          label="Powered by Gemini"
          size="small"
          sx={{ ml: 'auto', bgcolor: 'secondary.main', color: 'white' }}
        />
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f9f9f9' }}>
        <List>
          {messages.map((msg, idx) => (
            <ListItem
              key={idx}
              sx={{
                display: 'flex',
                justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                mb: 1
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  maxWidth: '80%',
                  flexDirection: msg.type === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <Avatar sx={{
                  bgcolor: msg.type === 'user' ? 'secondary.main' : 'primary.main'
                }}>
                  {msg.type === 'user' ? <Person /> : <SmartToy />}
                </Avatar>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    bgcolor: msg.type === 'user' ? 'secondary.main' : 'white',
                    color: msg.type === 'user' ? 'white' : 'text.primary'
                  }}
                >
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
                <Avatar sx={{ bgcolor: 'primary.main' }}>
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

      {/* Quick Questions */}
      {messages.length === 1 && (
        <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="caption" color="text.secondary" mb={1} display="block">
            Quick questions:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {quickQuestions.map((q, idx) => (
              <Chip
                key={idx}
                label={q}
                size="small"
                onClick={() => handleQuickQuestion(q)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Input */}
      <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Ask me anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        <IconButton color="secondary" onClick={handleSend} disabled={loading || !input.trim()}>
          <Send />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default Chatbot;
