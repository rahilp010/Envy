import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'PRODUCT_LIST';

export const saveProducts = async (products) =>
   await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));

export const getProducts = async () => {
   const data = await AsyncStorage.getItem(STORAGE_KEY);
   return data ? JSON.parse(data) : [];
};
