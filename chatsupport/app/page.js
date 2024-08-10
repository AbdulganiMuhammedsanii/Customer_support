"use client";
import { Box, Stack, Menu, Modal, TextField, Button, Typography, IconButton, Select, MenuItem, Avatar, ThemeProvider, createTheme, CssBaseline, useMediaQuery, Drawer } from '@mui/material';
import { Brightness4, Brightness7, AirplanemodeActive as AirplanemodeActiveIcon, Google, Menu as MenuIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, addDoc, Timestamp, getDocs } from 'firebase/firestore';
import { auth, provider, signInWithPopup, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';

const getInitialMessage = (language) => {
  switch (language) {
    case 'es':
      return '¡Hola! Bienvenido al Asesor Académico de Informática. ¿En qué puedo ayudarte hoy?';
    case 'zh':
      return '你好！欢迎来到计算机科学学术顾问！今天我能为您做些什么？';
    default:
      return 'Hello! Welcome to the Computer Science Academic Advisor. How can I assist you today?';
  }
};

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('en');
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null); // Anchor for the Menu component
  const [conversationHistory, setConversationHistory] = useState([]);
  const [messages, setMessages] = useState([{ role: 'assistant', content: getInitialMessage(language) }]);
  const [message, setMessage] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false); // State for Drawer

  const isMobile = useMediaQuery('(max-width:600px)');

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#90caf9' : '#1976d2',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#e0e0e0' : '#000000',
        secondary: darkMode ? '#b0b0b0' : '#5f6368',
      },
    },
    typography: {
      fontFamily: 'Roboto, sans-serif',
      h6: {
        fontWeight: 600,
      },
      body1: {
        fontSize: '1rem',
      },
      button: {
        textTransform: 'none',
      },
    },
  });

  useEffect(() => {
    setMessages([{ role: 'assistant', content: getInitialMessage(language) }]);
  }, [language]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget); // Opens the Menu
  const handleMenuClose = () => setAnchorEl(null); // Closes the Menu
  const toggleDrawer = () => setDrawerOpen(!drawerOpen); // Toggle Drawer

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      handleClose();
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setConversationHistory([]);
      handleMenuClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const sendMessage = async () => {
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: Timestamp.now(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setMessage('');

    if (user) {
      try {
        const conversationRef = collection(db, 'users', user.uid, 'conversations');
        await addDoc(conversationRef, userMessage);
      } catch (error) {
        console.error('Error saving message to Firestore:', error);
      }
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: message }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantMessageContent = '';

    const processText = async ({ done, value }) => {
      if (done) {
        const assistantMessage = {
          role: 'assistant',
          content: assistantMessageContent,
          timestamp: Timestamp.now(),
        };

        setMessages((prevMessages) => [...prevMessages, assistantMessage]);

        if (user) {
          try {
            const conversationRef = collection(db, 'users', user.uid, 'conversations');
            await addDoc(conversationRef, assistantMessage);
          } catch (error) {
            console.error('Error saving assistant response to Firestore:', error);
          }
        }

        return;
      }

      let text = decoder.decode(value || new Uint8Array(), { stream: true });
      text = text.replace(/^(Customer:|AI:)\s*/g, '');
      assistantMessageContent += text;

      const { value: nextValue, done: nextDone } = await reader.read();
      return processText({ done: nextDone, value: nextValue });
    };

    await reader.read().then(processText);
  };

  useEffect(() => {
    const fetchConversationHistory = async () => {
      if (user) {
        try {
          const conversationRef = collection(db, 'users', user.uid, 'conversations');
          const q = query(conversationRef, orderBy('timestamp', 'asc'));
          const querySnapshot = await getDocs(q);

          const history = querySnapshot.docs.map((doc) => ({
            role: doc.data().role,
            content: doc.data().content,
            timestamp: doc.data().timestamp.toDate(),
          }));

          setConversationHistory(history);
        } catch (error) {
          console.error("Error fetching conversation history:", error);
        }
      }
    };

    fetchConversationHistory();
  }, [user]);

  const drawer = (
    <Box
      width={isMobile ? '100%' : '350px'}
      height={isMobile ? 'auto' : '100vh'}
      p={3}
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      sx={{
        backgroundColor: darkMode ? '#1c1c1c' : '#fafafa',
        boxShadow: darkMode
          ? 'inset -1px 0 0 0 rgba(255, 255, 255, 0.12)'
          : 'inset -1px 0 0 0 rgba(0, 0, 0, 0.12)',
      }}
    >
      <Typography variant="h6" component="div" mb={3} sx={{ color: 'inherit', fontWeight: 'bold' }}>
        Conversation History
      </Typography>
      <Stack spacing={3} overflow="auto" sx={{ width: '100%' }}>
        {conversationHistory.map((conversation, index) => (
          <Box
            key={index}
            p={2}
            bgcolor={user ? (darkMode ? 'background.paper' : 'primary.light') : (darkMode ? '#1c1c1c' : '#f5f5f5')}
            color="text.primary"
            borderRadius={4}
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)"
            sx={{
              transition: 'background-color 0.3s, box-shadow 0.3s',
              '&:hover': {
                backgroundColor: user ? (darkMode ? '#333' : '#e3f2fd') : (darkMode ? '#1c1c1c' : '#f5f5f5'),
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              },
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              {conversation.role === 'assistant' ? 'Assistant' : 'You'}
            </Typography>
            <Typography variant="body2">{conversation.content}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        bgcolor="background.default"
        flexDirection={isMobile ? 'column' : 'row'}
        color="text.primary"
      >
        {isMobile ? (
          <>
            <Box
              width="100%"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              p={2}
              borderBottom="1px solid"
              borderColor="divider"
            >
              <IconButton
                edge="start"
                color="inherit"
                aria-label="open drawer"
                onClick={toggleDrawer}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                CornellGPT
              </Typography>
              <Box display="flex" alignItems="center" ml="auto">
                <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
                  {darkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
                <IconButton
                  color="inherit"
                  sx={{ ml: 2 }}
                  onClick={user ? handleMenuOpen : handleOpen}
                >
                  <Avatar src={user ? user.photoURL : null}>
                    {user ? null : <Google />}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      minWidth: 180,
                      bgcolor: 'background.paper',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                      '& .MuiMenuItem-root': {
                        padding: '12px 20px',
                      },
                    },
                  }}
                >
                  {user && (
                    <MenuItem onClick={handleSignOut} sx={{ color: 'error.main', fontWeight: 'bold' }}>
                      Sign Out
                    </MenuItem>
                  )}
                </Menu>
              </Box>
            </Box>
            <Drawer
              anchor="left"
              open={drawerOpen}
              onClose={toggleDrawer}
              PaperProps={{
                sx: { width: '100%', maxWidth: '300px' },
              }}
            >
              {drawer}
            </Drawer>
          </>
        ) : (
          <Box
            width="350px"
            height="100vh"
            borderRight="1px solid"
            borderColor="divider"
            p={3}
            display="flex"
            flexDirection="column"
            alignItems="flex-start"
            sx={{
              backgroundColor: darkMode ? '#1c1c1c' : '#fafafa',
              boxShadow: darkMode
                ? 'inset -1px 0 0 0 rgba(255, 255, 255, 0.12)'
                : 'inset -1px 0 0 0 rgba(0, 0, 0, 0.12)',
            }}
          >
            <Typography
              variant="h6"
              component="div"
              mb={3}
              sx={{
                color: 'text.primary',
                fontWeight: 'bold',
              }}
            >
              Conversation History
            </Typography>
            <Stack
              spacing={3}
              overflow="auto"
              sx={{
                width: '100%',
              }}
            >
              {conversationHistory.map((conversation, index) => (
                <Box
                  key={index}
                  p={2}
                  bgcolor={darkMode ? 'background.paper' : 'primary.light'}
                  color="text.primary"
                  borderRadius={4}
                  boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)"
                  sx={{
                    transition: 'background-color 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      backgroundColor: darkMode ? '#333' : '#e3f2fd',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                  >
                    {conversation.role === 'assistant' ? 'Assistant' : 'You'}
                  </Typography>
                  <Typography variant="body2">{conversation.content}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          justifyContent="flex-start"
          alignItems="center"
          p={3}
        >
          {!isMobile && (
            <Box
              width="100%"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              p={2}
              borderBottom="1px solid"
              borderColor="divider"
            >
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                CornellGPT
              </Typography>
              <Box display="flex" alignItems="center" ml="auto">
                <Select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 2, minWidth: '100px' }}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="zh">中文</MenuItem>
                </Select>
                <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
                  {darkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
                <IconButton
                  color="inherit"
                  sx={{ ml: 2 }}
                  onClick={user ? handleMenuOpen : handleOpen}
                >
                  <Avatar src={user ? user.photoURL : null}>
                    {user ? null : <Google />}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      minWidth: 180,
                      bgcolor: 'background.paper',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                      '& .MuiMenuItem-root': {
                        padding: '12px 20px',
                      },
                    },
                  }}
                >
                  {user && (
                    <MenuItem onClick={handleSignOut} sx={{ color: 'error.main', fontWeight: 'bold' }}>
                      Sign Out
                    </MenuItem>
                  )}
                </Menu>
              </Box>
            </Box>
          )}

          <Stack
            direction="column"
            width="100%"
            height="80vh"
            border="1px solid"
            borderColor="divider"
            borderRadius={2}
            p={2}
            mt={2}
            spacing={3}
            bgcolor="background.paper"
            sx={{
              overflowY: 'auto',
              boxShadow: darkMode
                ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
                : 'inset 0 1px 0 0 rgba(0, 0, 0, 0.1)',
            }}
          >
            <Stack direction="column" spacing={2} flexGrow={1}>
              {messages.map((message, index) => (
                <Box
                  key={index}
                  display="flex"
                  justifyContent={message.role === 'assistant' ? 'flex-start' : 'flex-end'}
                >
                  <Box
                    bgcolor={message.role === 'assistant' ? 'text.light' : 'primary.light'}
                    color={message.role === 'assistant' ? 'text.primary' : 'black'}
                    borderRadius={8}
                    p={2}
                    maxWidth="70%"
                    sx={{
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                      fontSize: '1rem',
                      transition: 'background-color 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                      },
                    }}
                  >
                    <Typography variant="body1" fontWeight={message.role === 'assistant' ? 'bold' : 'bold'}>
                      {message.content}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Type a message..."
                variant="outlined"
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                InputProps={{
                  sx: {
                    borderRadius: '8px',
                    backgroundColor: darkMode ? '#333' : '#fff',
                    boxShadow: darkMode ? '0 2px 10px rgba(0, 0, 0, 0.2)' : '0 2px 10px rgba(0, 0, 0, 0.1)',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: darkMode ? '#444' : '#ccc',
                      },
                      '&:hover fieldset': {
                        borderColor: darkMode ? '#555' : '#888',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: darkMode ? '#666' : '#1976d2',
                      },
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={sendMessage}
                sx={{
                  borderRadius: '8px',
                  padding: '10px 20px',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                  '&:hover': {
                    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.3)',
                  },
                }}
              >
                <AirplanemodeActiveIcon />
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="sign-in-modal"
          aria-describedby="sign-in-options"
        >
          <Box
            position="absolute"
            top="50%"
            left="50%"
            sx={{
              transform: 'translate(-50%, -50%)',
              width: 320,
              bgcolor: 'background.paper',
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              p: 4,  // Corrected this line
            }}
          >
            <Typography id="sign-in-modal" variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Sign In
            </Typography>
            <Button
              variant="contained"
              fullWidth
              color="primary"
              startIcon={<Google />}
              onClick={signInWithGoogle}
              sx={{
                mt: 2,
                py: 1.5,
                borderRadius: 4,
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  boxShadow: '0 6px 15px rgba(0, 0, 0, 0.3)',
                },
              }}
            >
              Sign in with Google
            </Button>
          </Box>

        </Modal>
      </Box>
    </ThemeProvider>
  );
}
