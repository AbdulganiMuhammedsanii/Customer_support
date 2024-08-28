"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Avatar, Menu, MenuItem, Modal, Grid, LinearProgress, Rating } from '@mui/material';
import { Brightness4, Brightness7, Google, School as SchoolIcon, Home as HomeIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { auth, provider, signInWithPopup } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { AuthContext } from '../../context/AuthContext';
import { useContext } from 'react';


export default function Explore() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [open, setOpen] = useState(false); // Modal state
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { user, darkMode, setDarkMode, signInWithGoogle, handleSignOut, language, message } = useContext(AuthContext);

  // Fetch courses from the database
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/chat', {
          method: 'GET',
        });
        console.log(res)
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setCourses(data);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setCourses([{ title: 'Error loading courses', description: error.message }]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleNavigate = () => {
    router.replace('/');  // Navigate back to the home page
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);


  const handleOpen = (cls) => {
    setSelectedClass(cls);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  // Apply consistent background color to the body
  useEffect(() => {
    document.body.style.backgroundColor = darkMode ? '#121212' : '#f5f5f5';
    document.body.style.color = darkMode ? '#e0e0e0' : '#000000';
  }, [darkMode]);

  return (
    <Box
      width="100vw"
      minHeight="100vh"
      display="flex"
      flexDirection="column"
      bgcolor={darkMode ? '#121212' : '#f5f5f5'}
      color={darkMode ? '#e0e0e0' : '#000000'}
    >
      <Box
        width="100%"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        p={2}
        borderBottom="1px solid"
        borderColor={darkMode ? '#444' : '#ccc'}
      >
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'inherit' }}>
          Explore Courses
        </Typography>

        <Box display="flex" alignItems="center" ml="auto">
          <IconButton
            onClick={handleNavigate}
            color="inherit"
            sx={{ mr: 2 }}
          >
            <HomeIcon /> {/* Adjust the size of the icon */}
          </IconButton>


          <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
            {darkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          <IconButton
            color="inherit"
            sx={{ ml: 2 }}
          >

            <Avatar
              onClick={user ? handleSignOut : signInWithGoogle}
              sx={{
                bgcolor: darkMode ? '#1c1c1c' : '#f5f5f5',
                color: darkMode ? '#90caf9' : '#1976d2',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
              }}
            >
              {user ? <Avatar src={user.photoURL} /> : <Google />}
            </Avatar>
          </IconButton>
        </Box>
      </Box>

      <Box
        display="flex"
        justifyContent="center" // Center the content horizontally
        alignItems="center"
        flexGrow={1}
        p={3}
        bgcolor={darkMode ? '#121212' : '#f5f5f5'}
      >
        <Box width="100%" maxWidth="1200px" p={1}>
          {loading ? (
            <Typography variant="h6" sx={{ color: 'inherit', textAlign: 'center', width: '100%' }}>
              Loading courses...
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {courses.sort((a, b) => a.title.localeCompare(b.title)).map((cls) => (
                <Grid item xs={12} sm={6} key={cls.id}>
                  <Button
                    variant="outlined"
                    sx={{
                      width: '100%',
                      height: '100%',
                      padding: '20px',
                      backgroundColor: darkMode ? '#333' : '#ddd',
                      color: darkMode ? '#fff' : '#000',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                      '&:hover': {
                        backgroundColor: darkMode ? '#444' : '#ccc',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                      },
                    }}
                    onClick={() => handleOpen(cls)}
                  >
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'inherit' }}>
                      {cls.title}
                    </Typography>
                    <Box sx={{ mt: 2, width: '100%' }}>
                      <Typography variant="body2" sx={{ mb: 1, color: 'inherit' }}>
                        Difficulty
                      </Typography>
                      <LinearProgress variant="determinate" value={(cls.difficulty / 5) * 100} sx={{ height: 10, borderRadius: 5 }} />
                    </Box>
                    <SchoolIcon sx={{ position: 'absolute', top: 8, right: 8, color: darkMode ? '#90caf9' : '#1976d2' }} />
                  </Button>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>

      <Modal open={open} onClose={handleClose}>
        <Box
          p={4}
          bgcolor={darkMode ? '#333' : '#fff'}
          color={darkMode ? '#fff' : '#000'}
          borderRadius={2}
          boxShadow="0px 2px 10px rgba(0,0,0,0.2)"
          mx="auto"
          mt="10vh"
          maxWidth="600px"
          width="80%"
          textAlign="center"
          position="relative"
        >
          <IconButton
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: darkMode ? '#90caf9' : '#1976d2'
            }}
          >
            <SchoolIcon />
          </IconButton>
          <Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 'bold' }}>
            {selectedClass?.title}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {selectedClass?.description}
          </Typography>
          <Box sx={{ mt: 2, width: '100%' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Professor: {selectedClass?.professor}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              RateMyProfessors Rating:
            </Typography>
            <Rating
              name="professor-rating"
              value={selectedClass?.professor_rating}
              precision={0.1}
              readOnly
            />
          </Box>
          <Box sx={{ mt: 2, width: '100%' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Difficulty
            </Typography>
            <LinearProgress variant="determinate" value={(selectedClass?.difficulty / 5) * 100} sx={{ height: 10, borderRadius: 5 }} />
          </Box>
          <Button
            variant="contained"
            onClick={handleClose}
            sx={{
              mt: 4,
              backgroundColor: darkMode ? '#555' : '#007BFF',
              color: '#fff',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
              '&:hover': {
                boxShadow: '0 6px 15px rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            Close
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
