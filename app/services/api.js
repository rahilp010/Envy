// Replace with your backend URL
// const API_URL = 'http://localhost:8001/api';
const API_URL = 'https://electron-server-plum.vercel.app/api';


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
};

export default api;