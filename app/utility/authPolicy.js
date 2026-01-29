import AsyncStorage from "@react-native-async-storage/async-storage";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export const isPasswordRequired = async () => {
    const last = await AsyncStorage.getItem('lastPasswordAuth');
    if (!last) return true;

    return Date.now() - Number(last) >= SEVEN_DAYS;
};