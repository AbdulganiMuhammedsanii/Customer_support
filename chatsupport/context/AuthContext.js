// context/AuthContext.js
"use client";
import React, { createContext, useState, useEffect } from 'react';
import { auth, provider } from '../lib/firebase'; // Make sure this path is correct
import { signInWithPopup, signOut } from 'firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(true);




  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    const savedDarkMode = JSON.parse(localStorage.getItem('darkMode'));

    if (savedUser) {
      setUser(savedUser);
    }

    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [user, darkMode]);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, darkMode, setDarkMode, signInWithGoogle, handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};
