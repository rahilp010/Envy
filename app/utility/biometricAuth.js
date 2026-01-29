import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics({
    allowDeviceCredentials: true,
});

export const authenticateWithBiometrics = async () => {
    try {
        const { available } = await rnBiometrics.isSensorAvailable();

        if (!available) {
            return { success: false, cancelled: false };
            // throw new Error('Biometric authentication not available');

        }

        const result = await rnBiometrics.simplePrompt({
            promptMessage: 'Authenticate to Unlock Envy',
            cancelButtonText: 'Cancel',
        });

        // ✅ SUCCESS
        if (result?.success) {
            return { success: true, cancelled: false };
        }

        // ❌ Explicit cancel
        return { success: false, cancelled: true };
    } catch (error) {
        console.log('Auth error:', error);
        return { success: false, cancelled: true };
    }
};
