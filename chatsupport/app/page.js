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
    // Add the user's message to the conversation
    setMessages((prevMessages) => [...prevMessages, { role: 'user', content: message }]);

    // Clear the input field
    setMessage('');

    // Send the message to the API
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: message }),  // Adjusted to match the API's expected input format
    });

    // Initialize a string to hold the entire response
    let fullResponse = '';

    // Read the response stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // Process the text chunks from the stream
    const processText = async ({ done, value }) => {
      if (done) {
        // The stream is complete, so we can stop processing
        return;
      }

      // Decode the incoming chunk of text
      let text = decoder.decode(value || new Uint8Array(), { stream: true });
      text = text.replace(/^(Customer:|AI:)\s*/g, '');
      // Update the last assistant's message with the new chunk of text
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];

        // Check if the last message is from the assistant
        if (lastMessage.role === 'assistant') {
          // Update the assistant's message with the new text
          const updatedMessage = { ...lastMessage, content: lastMessage.content + text };
          const otherMessages = prevMessages.slice(0, prevMessages.length - 1);

          return [...otherMessages, updatedMessage];
        } else {
          // If the last message is not from the assistant, just add the new message
          return [...prevMessages, { role: 'assistant', content: text }];
        }
      });

      // Continue reading the next chunk of the stream
      const { value: nextValue, done: nextDone } = await reader.read();
      return processText({ done: nextDone, value: nextValue });
    };
    // Start reading the stream
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