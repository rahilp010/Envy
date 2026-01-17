import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const systemTheme = Appearance.getColorScheme(); // 'light' | 'dark'
    const [theme, setTheme] = useState(systemTheme || 'light');

    // Load saved theme
    useEffect(() => {
        (async () => {
            const savedTheme = await AsyncStorage.getItem('APP_THEME');
            if (savedTheme) setTheme(savedTheme);
        })();
    }, []);

    // Save theme
    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        await AsyncStorage.setItem('APP_THEME', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
