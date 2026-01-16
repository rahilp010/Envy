import RNBlobUtil from 'react-native-blob-util';
import { Alert, Linking, Platform } from "react-native";


// Replace with your backend URL
const API_URL = 'http://10.162.29.73:8001/api';
// const API_URL = 'https://electron-server-plum.vercel.app/api';


const api = {
    // Create new account
    createAccount: async (accountData) => {
        try {
            const response = await fetch(`${API_URL}/accounts/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(accountData),
            });
            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },

    // Login
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/accounts/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },

    // Get account balance
    getBalance: async (accountNumber) => {
        try {
            const response = await fetch(`${API_URL}/accounts/${accountNumber}/balance`);
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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transferData),
            });
            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },

    transferAmountHistory: async () => {
        try {
            const response = await fetch(`${API_URL}/ledger/history`);

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
            const response = await fetch(`${API_URL}/account/${accountNumber}/transactions`);
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
                headers: { 'Content-Type': 'application/json' },
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
                headers: { 'Content-Type': 'application/json' },
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
            const response = await fetch(`${API_URL}/products`);
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
                headers: { 'Content-Type': 'application/json' },
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

    updateClient: async (id, clientData) => {
        try {
            const res = await fetch(`${API_URL}/clients/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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
            const response = await fetch(`${API_URL}/clients`);
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
                headers: { 'Content-Type': 'application/json' },
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
                headers: { 'Content-Type': 'application/json' },
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
            const response = await fetch(`${API_URL}/purchase`);
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
                headers: { 'Content-Type': 'application/json' },
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
                headers: { 'Content-Type': 'application/json' },
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
            const response = await fetch(`${API_URL}/sales`);
            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },

    getAllAccounts: async () => {
        try {
            const response = await fetch(`${API_URL}/account`);
            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },

    updateAccount: async (id, accountData) => {
        try {
            const res = await fetch(`${API_URL}/account/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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
            const response = await fetch(`${API_URL}/ledger/client/${id}`);
            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },

    deleteLedgerEntry: async (id) => {
        try {
            const res = await fetch(`${API_URL}/ledger/${id}`, {
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
                headers: { 'Content-Type': 'application/json' },
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
                    headers: { 'Content-Type': 'application/json' },
                },
            );

            return await response.json();
        } catch (error) {
            throw new Error('Network error: ' + error.message);
        }
    },

    // openSalesPDF: async () => {
    //     try {
    //         const response = await fetch(`${API_URL}/sales`, {
    //             method: 'GET',
    //             headers: { 'Content-Type': 'application/json' },
    //         });

    //         if (!response.ok) {
    //             const text = await response.text();
    //             throw new Error(text);
    //         }

    //         const blob = await response.blob();
    //         const url = URL.createObjectURL(blob);
    //         const link = document.createElement('a');
    //         link.href = url;
    //         link.download = 'sales.pdf';
    //         link.click();
    //         URL.revokeObjectURL(url);
    //     } catch (error) {
    //         throw new Error('Network error: ' + error.message);
    //     }
    // },

    openSalesPDF: async () => {
        try {
            const res = await RNBlobUtil.config({
                fileCache: true,
                appendExt: 'pdf',
            }).fetch('GET', `${API_URL}/sales/pdf`);

            console.log('DOWNLOAD SUCCESS:', res.path());
        } catch (err) {
            console.log('RAW ERROR:', err);
            console.log('ERROR STRING:', String(err));
            console.log('ERROR JSON:', JSON.stringify(err, null, 2));

            Alert.alert(
                'Download failed',
                err?.message || 'Unknown native error',
            );
        }
    },

    openSalesExcel: async () => {
        try {
            await Linking.openURL(`${API_URL}/sales/excel`);
        } catch (e) {
            Alert.alert('Error', 'Unable to download Excel');
        }
    },

    getPendingCollections: async () => {
        try {
            const response = await fetch(`${API_URL}/reports/pendingCollection`);
            return await response.json();
        } catch (error) {
            Alert.alert('Error', 'Unable to load data');
            throw error;
        }
    },

    getPendingPayments: async () => {
        try {
            const response = await fetch(`${API_URL}/reports/pendingPayment`);
            return await response.json();
        } catch (error) {
            Alert.alert('Error', 'Unable to load data');
        }
    }

};

export default api;