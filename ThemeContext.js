// ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { auth, db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState('auto');

  const currentTheme = theme === 'auto' ? systemTheme : theme;

  useEffect(() => {
    const fetchUserTheme = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const savedTheme = docSnap.data().theme;
        if (savedTheme) setTheme(savedTheme);
      }
    };
    fetchUserTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
