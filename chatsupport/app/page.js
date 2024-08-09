"use client";
import { Box, Stack, TextField, Button, Typography, IconButton, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useState } from 'react';
import { GlobalStyles } from '@mui/system';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './styles.css'; // Create a styles.css file for transitions

export default function Home() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hello! Welcome to Zara Customer Service! How can I assist you today?' }]);
  const [message, setMessage] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  const sendMessage = async () => {
    setMessages((prevMessages) => [...prevMessages, { role: 'user', content: message }, { role: 'assistant', content: '' }]);
    setMessage('');

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ role: 'user', content: message }]),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';

    const processText = async ({ done, value }) => {
      if (done) {
        return result;
      }
      const text = decoder.decode(value || new Uint8Array(), { stream: true });
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        const otherMessages = prevMessages.slice(0, prevMessages.length - 1);

        return [...otherMessages, { ...lastMessage, content: lastMessage.content + text }];
      });

      const { value: nextValue, done: nextDone } = await reader.read();
      return processText({ done: nextDone, value: nextValue });
    };

    await reader.read().then(processText);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={{
        body: {
          transition: 'background-color 0.5s ease, color 0.5s ease',
        },
      }} />
      <CSSTransition
        in={darkMode}
        timeout={500}
        classNames="fade"
      >
        <Box
          width="100vw"
          height="100vh"
          display="flex"
          flexDirection="column"
          justifyContent="flex-start"
          alignItems="center"
          bgcolor="background.default"
          color="text.primary"
        >
          <Box
            width="100%"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            p={2}
            borderBottom="1px solid"
            borderColor="divider"
          >
            <Typography variant="h6" component="div">
              Zara Chatbot
            </Typography>
            <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Box>
          <Stack
            direction={'column'}
            width="500px"
            height="700px"
            border="1px solid"
            borderColor="divider"
            borderRadius={2}
            p={2}
            mt={2}
            spacing={3}
            bgcolor="background.paper"
          >
            <Stack direction={'column'} spacing={2} flexGrow={1} overflow="auto" maxHeight="100%">
              {messages.map((message, index) => (
                <Box
                  key={index}
                  display="flex"
                  justifyContent={message.role === 'assistant' ? 'flex-start' : 'flex-end'}
                >
                  <Box
                    bgcolor={message.role === 'assistant' ? 'primary.main' : 'secondary.main'}
                    color="white"
                    borderRadius={16}
                    p={2}
                  >
                    <Typography variant="body1">{message.content}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
            <Stack direction={'row'} spacing={2}>
              <TextField
                label="Message"
                variant="outlined"
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button variant="contained" onClick={sendMessage}>
                Send
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CSSTransition>
    </ThemeProvider>
  );
}