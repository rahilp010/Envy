import { createSlice } from '@reduxjs/toolkit';
import { loadFromStorage, saveToStorage } from '../storage';

const createStorageSlice = (key) => ({
  data: loadFromStorage(key, []),
  isLoading: false,
});

const ensureArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr;
};

const safeParseModifiers = (value) => {
  try {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.startsWith('[')) {
      return JSON.parse(value);
    }
    if (typeof value === 'string') {
      return value.split(',').map((v) => v.trim());
    }
    return [];
  } catch {
    return [];
  }
};

export const envySlice = createSlice({
  name: 'envy',
  initialState: {
    products: createStorageSlice('products'),
    clients: createStorageSlice('clients'),
    clientProducts: createStorageSlice('clientProducts'),
    transaction: createStorageSlice('transaction'),
    transactionItems: createStorageSlice('transactionItems'),
    settings: createStorageSlice('settings'),
    keyBindings: { data: [], loading: false, error: null },
    bankReceipt: createStorageSlice('bankReceipt'),
    cashReceipt: createStorageSlice('cashReceipt'),
    account: createStorageSlice('account'),
    currentUser: loadFromStorage('currentUser', null),
    isAuthenticated: loadFromStorage('isAuthenticated', false),
  },
  reducers: {
    setAuth: (state, action) => {
      state.isAuthenticated = action.payload;
      saveToStorage('isAuthenticated', action.payload);
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
      saveToStorage('currentUser', action.payload);
    },

    createProduct: (state, action) => {
      state.products.data = ensureArray(state.products.data);
      state.products.data.push(action.payload);
      state.products.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      saveToStorage('products', state.products.data);
    },
    updateProduct: (state, action) => {
      state.products.data = ensureArray(state.products.data);
      const updatedProduct = action.payload;
      const index = state.products.data.findIndex((p) => p.id === updatedProduct.id);
      if (index !== -1) {
        state.products.data[index] = updatedProduct;
        saveToStorage('products', state.products.data);
      }
    },
    deleteProduct: (state, action) => {
      state.products.data = ensureArray(state.products.data).filter(
        (product) => product.id !== action.payload
      );
      saveToStorage('products', state.products.data);
    },
    setProducts: (state, action) => {
      state.products.data = ensureArray(state.products.data);
      if (Array.isArray(action.payload)) {
        state.products.data = action.payload;
      } else {
        state.products.data.push(action.payload);
      }
      saveToStorage('products', state.products.data);
    },
    getProducts: (state) => {
      state.products.data = loadFromStorage('products', []);
    },

    createClient: (state, action) => {
      state.clients.data = ensureArray(state.clients.data);
      state.clients.data.push(action.payload);
      state.clients.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      saveToStorage('clients', state.clients.data);
    },
    updateClient: (state, action) => {
      state.clients.data = ensureArray(state.clients.data);
      const updatedClient = action.payload;
      const index = state.clients.data.findIndex((c) => c.id === updatedClient.id);
      if (index !== -1) {
        state.clients.data = [
          ...state.clients.data.slice(0, index),
          updatedClient,
          ...state.clients.data.slice(index + 1),
        ];
        saveToStorage('clients', state.clients.data);
      }
    },
    deleteClient: (state, action) => {
      state.clients.data = ensureArray(state.clients.data).filter(
        (c) => c.id !== action.payload
      );
      saveToStorage('clients', state.clients.data);
    },
    setClients: (state, action) => {
      state.clients.data = ensureArray(state.clients.data);
      if (Array.isArray(action.payload)) {
        state.clients.data = action.payload;
      } else {
        state.clients.data.push(action.payload);
      }
      saveToStorage('clients', state.clients.data);
    },
    getClients: (state) => {
      state.clients.data = loadFromStorage('clients', []);
    },

    clientProducts: (state, action) => {
      state.clientProducts.data = ensureArray(state.clientProducts.data);
      const clientProduct = action.payload;
      const index = state.clientProducts.data.findIndex((c) => c.id === clientProduct.id);
      if (index !== -1) {
        state.clientProducts.data[index] = clientProduct;
        saveToStorage('clientProducts', state.clientProducts.data);
      }
    },

    addTransaction: (state, action) => {
      state.transaction.data = ensureArray(state.transaction.data);
      state.transaction.data.push(action.payload);
      state.transaction.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      saveToStorage('transaction', state.transaction.data);
    },
    updateTransaction: (state, action) => {
      state.transaction.data = ensureArray(state.transaction.data);
      const updatedTransaction = action.payload;
      const index = state.transaction.data.findIndex((t) => t.id === updatedTransaction.id);
      if (index !== -1) {
        state.transaction.data[index] = updatedTransaction;
        saveToStorage('transaction', state.transaction.data);
      }
    },
    deleteTransaction: (state, action) => {
      state.transaction.data = ensureArray(state.transaction.data).filter(
        (t) => t.id !== action.payload
      );
      saveToStorage('transaction', state.transaction.data);
    },
    setTransactions: (state, action) => {
      state.transaction.data = ensureArray(state.transaction.data);
      if (Array.isArray(action.payload)) {
        state.transaction.data = action.payload;
      } else {
        state.transaction.data.push(action.payload);
      }
      saveToStorage('transaction', state.transaction.data);
    },
    getTransaction: (state) => {
      state.transaction.data = loadFromStorage('transaction', []);
    },

    createBankReceipt: (state, action) => {
      state.bankReceipt.data = ensureArray(state.bankReceipt.data);
      state.bankReceipt.data.push(action.payload);
      state.bankReceipt.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      saveToStorage('bankReceipt', state.bankReceipt.data);
    },
    updateBankReceipt: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      state.bankReceipt.data = ensureArray(state.bankReceipt.data);
      const index = state.bankReceipt.data.findIndex((b) => b.id === updated.id);
      if (index !== -1) {
        state.bankReceipt.data[index] = updated;
      } else {
        state.bankReceipt.data.push(updated);
      }
      saveToStorage('bankReceipt', state.bankReceipt.data);
    },
    setBankReceipt: (state, action) => {
      state.bankReceipt.data = ensureArray(state.bankReceipt.data);
      if (Array.isArray(action.payload)) {
        state.bankReceipt.data = action.payload;
      } else {
        state.bankReceipt.data.push(action.payload);
      }
      saveToStorage('bankReceipt', state.bankReceipt.data);
    },
    deleteBankReceipt: (state, action) => {
      state.bankReceipt.data = ensureArray(state.bankReceipt.data).filter(
        (b) => b.id !== action.payload
      );
      saveToStorage('bankReceipt', state.bankReceipt.data);
    },
    getBankReceipt: (state) => {
      state.bankReceipt.data = loadFromStorage('bankReceipt', []);
    },

    createCashReceipt: (state, action) => {
      state.cashReceipt.data = ensureArray(state.cashReceipt.data);
      const newReceipt = action.payload;
      if (!newReceipt || typeof newReceipt !== 'object') return;
      state.cashReceipt.data.push(newReceipt);
      state.cashReceipt.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      saveToStorage('cashReceipt', state.cashReceipt.data);
    },
    updateCashReceipt: (state, action) => {
      state.cashReceipt.data = ensureArray(state.cashReceipt.data);
      const updated = action.payload;
      if (!updated || typeof updated.id === 'undefined') return;
      const index = state.cashReceipt.data.findIndex((r) => r.id === updated.id);
      if (index !== -1) {
        state.cashReceipt.data[index] = updated;
        saveToStorage('cashReceipt', state.cashReceipt.data);
      }
    },
    setCashReceipt: (state, action) => {
      state.cashReceipt.data = ensureArray(state.cashReceipt.data);
      const payload = action.payload;
      if (Array.isArray(payload)) {
        state.cashReceipt.data = payload;
      } else if (payload && typeof payload === 'object') {
        state.cashReceipt.data.push(payload);
      }
      saveToStorage('cashReceipt', state.cashReceipt.data);
    },
    deleteCashReceipt: (state, action) => {
      state.cashReceipt.data = ensureArray(state.cashReceipt.data);
      state.cashReceipt.data = state.cashReceipt.data.filter(
        (cashReceipt) => cashReceipt.id !== action.payload
      );
      saveToStorage('cashReceipt', state.cashReceipt.data);
    },
    getCashReceipt: (state) => {
      state.cashReceipt.data = loadFromStorage('cashReceipt', []);
    },

    createSettings: (state, action) => {
      state.settings.data = ensureArray(state.settings.data);
      const newSetting = action.payload;
      if (newSetting && newSetting.id) {
        const exists = state.settings.data.some((s) => s.id === newSetting.id);
        if (!exists) {
          state.settings.data.push(newSetting);
        }
      }
      saveToStorage('settings', state.settings.data);
    },
    updateSettings: (state, action) => {
      state.settings.data = ensureArray(state.settings.data);
      const updatedSetting = action.payload;
      const index = state.settings.data.findIndex((s) => s.id === updatedSetting.id);
      if (index !== -1) {
        state.settings.data[index] = updatedSetting;
      } else {
        state.settings.data.push(updatedSetting);
      }
      saveToStorage('settings', state.settings.data);
    },
    setSettings: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.settings.data = action.payload;
      } else if (action.payload && typeof action.payload === 'object') {
        state.settings.data = ensureArray(state.settings.data);
        const exists = state.settings.data.some((s) => s.id === action.payload.id);
        if (!exists) {
          state.settings.data.push(action.payload);
        }
      }
      saveToStorage('settings', state.settings.data);
    },
    getSettings: (state) => {
      state.settings.data = loadFromStorage('settings', []);
    },

    setKeyBindings: (state, action) => {
      const rawData = Array.isArray(action.payload) ? action.payload : [];
      state.keyBindings.data = rawData.map((kb) => ({
        ...kb,
        modifiers: safeParseModifiers(kb.modifiers),
        enabled: Boolean(kb.enabled),
      }));
      state.keyBindings.loading = false;
    },
    updateKeyBinding: (state, action) => {
      const index = state.keyBindings.data.findIndex((kb) => kb.id === action.payload.id);
      if (index !== -1) {
        state.keyBindings.data[index] = {
          ...action.payload,
          modifiers: safeParseModifiers(action.payload.modifiers),
          enabled: Boolean(action.payload.enabled),
        };
      }
    },
    deleteKeyBinding: (state, action) => {
      state.keyBindings.data = state.keyBindings.data.filter((kb) => kb.id !== action.payload);
    },

    createAccount: (state, action) => {
      state.account.data = ensureArray(state.account.data);
      state.account.data.push(action.payload);
      state.account.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      saveToStorage('account', state.account.data);
    },
    updateAccount: (state, action) => {
      state.account.data = ensureArray(state.account.data);
      const index = state.account.data.findIndex((acc) => acc.id === action.payload.id);
      if (index !== -1) {
        state.account.data[index] = action.payload;
        state.account.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        saveToStorage('account', state.account.data);
      }
    },
    deleteAccount: (state, action) => {
      state.account.data = ensureArray(state.account.data).filter(
        (acc) => acc.id !== action.payload
      );
      saveToStorage('account', state.account.data);
    },
    getAccount: (state) => {
      state.account.data = loadFromStorage('account', []);
    },
    setAccount: (state, action) => {
      state.account.data = Array.isArray(action.payload) ? action.payload : [action.payload];
      saveToStorage('account', state.account.data);
    },
  },
});

export const {
  setAuth,
  setCurrentUser,
  createProduct,
  updateProduct,
  deleteProduct,
  setProducts,
  getProducts,
  createClient,
  updateClient,
  deleteClient,
  setClients,
  getClients,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  setTransactions,
  getTransaction,
  createBankReceipt,
  updateBankReceipt,
  setBankReceipt,
  getBankReceipt,
  createCashReceipt,
  updateCashReceipt,
  setCashReceipt,
  getCashReceipt,
  createSettings,
  updateSettings,
  setSettings,
  getSettings,
  setKeyBindings,
  updateKeyBinding,
  deleteKeyBinding,
  clientProducts,
  deleteBankReceipt,
  deleteCashReceipt,
  getAccount,
  setAccount,
  deleteAccount,
  updateAccount,
  createAccount,
} = envySlice.actions;

export default envySlice.reducer;
