import AsyncStorage from '@react-native-async-storage/async-storage';

export const SYSTEM_ACCOUNTS = ['bank account', 'cash account'];

const CLIENT_CACHE_KEY = 'CLIENTS_CACHE';

export const saveClientsToCache = async clients => {
    await AsyncStorage.setItem(
        CLIENT_CACHE_KEY,
        JSON.stringify(clients),
    );
};

export const getClientsFromCache = async () => {
    const data = await AsyncStorage.getItem(CLIENT_CACHE_KEY);
    return data ? JSON.parse(data) : null;
};

export const clearClientCache = async () => {
    await AsyncStorage.removeItem(CLIENT_CACHE_KEY);
};
