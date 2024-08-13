// context/AuthContext.js
"use client";
import React, { createContext, useState, useEffect } from 'react';
import { auth, provider } from '../lib/firebase'; // Make sure this path is correct
import { signInWithPopup, signOut } from 'firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('en');

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

  const [messages, setMessages] = useState([{ role: 'assistant', content: getInitialMessage(language) }]);


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
    <AuthContext.Provider value={{ user, darkMode, setDarkMode, signInWithGoogle, handleSignOut, getInitialMessage, language, messages }}>
      {children}
    </AuthContext.Provider>
  );
};
