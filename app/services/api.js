import RNBlobUtil from 'react-native-blob-util';
import { Alert, Linking, Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';


// Replace with your backend URL
const API_URL = 'http://10.31.37.73:8001/api';
// const API_URL = 'https://electron-server-plum.vercel.app/api';
const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');

    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};


const api = {

    signup: async (userData) => {
        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });
            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },

    login: async (userData) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        return data;
    },

    logout: async () => {
        try {
            const response = await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: await getAuthHeaders(),
            });
            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },

    // Get account balance
    getBalance: async (accountNumber) => {
        try {
            const response = await fetch(`${API_URL}/accounts/${accountNumber}/balance`, { headers: await getAuthHeaders(), });
            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },

    // Transfer amount
    transferAmount: async (transferData) => {
        try {
            const response = await fetch(`${API_URL}/transfer`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify(transferData),
            });
            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },

    transferAmountHistory: async () => {
        try {
            const response = await fetch(`${API_URL}/ledger/history`, { headers: await getAuthHeaders(), });

            if (!response.ok) {
                throw new Error('Failed to fetch transfer history');
            }

            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },

    // Get transaction history
    getTransactions: async (accountNumber) => {
        try {
            const response = await fetch(`${API_URL}/account/${accountNumber}/transactions`, { headers: await getAuthHeaders(), });
            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },

    // Products
    createProduct: async (productData) => {
        try {
            const res = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify(productData),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            return await res.json();
        } catch (err) {
            throw new Error(err.message);
        }
    },

    updateProduct: async (id, productData) => {
        try {
            const res = await fetch(`${API_URL}/products/${id}`, {
                method: 'PUT',
                headers: await getAuthHeaders(),
                body: JSON.stringify(productData),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            return await res.json();
        } catch (err) {
            throw new Error(err.message);
        }
    },

    deleteProduct: async (id) => {
        try {
            const res = await fetch(`${API_URL}/products/${id}`, {
                headers: await getAuthHeaders(),
                method: 'DELETE',
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            return await res.json();
        } catch (err) {
            throw new Error(err.message);
        }
    },

    getAllProducts: async () => {
        try {
            const response = await fetch(`${API_URL}/products`, {
                headers: await getAuthHeaders(),
            });
            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },


    //Clients

    createClient: async (clientData) => {
        try {
            const res = await fetch(`${API_URL}/clients`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify(clientData),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            return await res.json();
        } catch (err) {
            // throw new Error(err.message);
            console.log('Create client error:', err.message);
            Alert.alert(
                'Failed to create client',
                err.message || 'Something went wrong'
            );
        }
    },

    updateClient: async (id, clientData) => {
        try {
            const res = await fetch(`${API_URL}/clients/${id}`, {
                method: 'PUT',
                headers: await getAuthHeaders(),
                body: JSON.stringify(clientData),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            return await res.json();
        } catch (err) {
            throw new Error(err.message);
        }
    },

    deleteClient: async (id) => {
        try {
            const res = await fetch(`${API_URL}/clients/${id}`, {
                headers: await getAuthHeaders(),
                method: 'DELETE',
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            return await res.json();
        } catch (err) {
            throw new Error(err.message);
        }
    },

    getAllClients: async () => {
        try {
            const response = await fetch(`${API_URL}/clients`, { headers: await getAuthHeaders(), });
            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },


    //Purchase

    createPurchase: async (purchaseData) => {
        try {
            const res = await fetch(`${API_URL}/purchase`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify(purchaseData),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            return await res.json();
        } catch (err) {
            throw new Error(err.message);
        }
    },

    updatePurchase: async (id, purchaseData) => {
        try {
            const res = await fetch(`${API_URL}/purchase/${id}`, {
                method: 'PUT',
                headers: await getAuthHeaders(),
                body: JSON.stringify(purchaseData),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            return await res.json();
        } catch (err) {
            throw new Error(err.message);
        }
    },

    deletePurchase: async (id) => {
        try {
            const res = await fetch(`${API_URL}/purchase/${id}`, {
                headers: await getAuthHeaders(),
                method: 'DELETE',
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            return await res.json();
        } catch (err) {
            throw new Error(err.message);
        }
    },

    getAllPurchases: async () => {
        try {
            const response = await fetch(`${API_URL}/purchase`, { headers: await getAuthHeaders(), });
            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },


    //Sales

    createSales: async (saleData) => {
        try {
            const res = await fetch(`${API_URL}/sales`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify(saleData),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            return await res.json();
        } catch (err) {
            throw new Error(err.message);
        }
    },

    updateSales: async (id, saleData) => {
        try {
            const res = await fetch(`${API_URL}/sales/${id}`, {
                method: 'PUT',
                headers: await getAuthHeaders(),
                body: JSON.stringify(saleData),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            return await res.json();
        } catch (err) {
            throw new Error(err.message);
        }
    },

    deleteSales: async (id) => {
        try {
            const res = await fetch(`${API_URL}/sales/${id}`, {
                headers: await getAuthHeaders(),
                method: 'DELETE',
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            return await res.json();
        } catch (err) {
            throw new Error(err.message);
        }
    },

    getAllSales: async () => {
        try {
            const response = await fetch(`${API_URL}/sales`, {
                headers: await getAuthHeaders(),
            });
            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },

    getAllAccounts: async () => {
        try {
            const response = await fetch(`${API_URL}/account`, {
                headers: await getAuthHeaders(),
            });
            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },

    updateAccount: async (id, accountData) => {
        try {
            const res = await fetch(`${API_URL}/account/${id}`, {
                method: 'PUT',
                headers: await getAuthHeaders(),
                body: JSON.stringify(accountData),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            return await res.json();
        } catch (err) {
            throw new Error(err.message);
        }
    },

    deleteAccount: async (id) => {
        try {
            const res = await fetch(`${API_URL}/account/${id}`, {
                headers: await getAuthHeaders(),
                method: 'DELETE',
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            return await res.json();
        } catch (err) {
            throw new Error(err.message);
        }
    },

    getClientLedger: async (id) => {
        try {
            const response = await fetch(`${API_URL}/ledger/client/${id}`, {
                headers: await getAuthHeaders(),
            });
            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },

    deleteLedgerEntry: async (id) => {
        try {
            const res = await fetch(`${API_URL}/ledger/${id}`, {
                headers: await getAuthHeaders(),
                method: 'DELETE',
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            return await res.json();
        } catch (err) {
            throw new Error(err.message);
        }
    },

    deleteMultipleLedgerEntries: async (ids) => {
        try {
            const res = await fetch(`${API_URL}/ledger/bulk`, {
                method: 'DELETE',
                headers: await getAuthHeaders(),
                body: JSON.stringify({ ids }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            return await res.json();
        } catch (err) {
            throw new Error(err.message);
        }
    },

    getAnalytics: async (params = {}) => {
        try {
            const query = new URLSearchParams(
                Object.entries(params).filter(([_, v]) => v),
            ).toString();

            const response = await fetch(
                `${API_URL}/analytics${query ? `?${query}` : ''}`,
                {
                    method: 'GET',
                    headers: await getAuthHeaders(),
                },
            );

            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },

    getPendingCollections: async () => {
        try {
            const response = await fetch(`${API_URL}/reports/pendingCollection`, {
                headers: await getAuthHeaders(),
            });
            return await response.json();
        } catch (error) {
            Alert.alert('Error', 'Unable to load data');
            throw error;
        }
    },

    getPendingPayments: async () => {
        try {
            const response = await fetch(`${API_URL}/reports/pendingPayment`, { headers: await getAuthHeaders(), });
            return await response.json();
        } catch (error) {
            Alert.alert('Error', 'Unable to load data');
        }
    },

    exportPendingPDF: async () => {
        try {
            const res = await fetch(`${API_URL}/generate/pending`, {
                headers: await getAuthHeaders(),
            });
            return await res.json();
        } catch (error) {
            Alert.alert('Error', 'Unable to load data');
        }
    }


};

export default api;