import { configureStore } from '@reduxjs/toolkit';
import envyReducer from './features/envySlice';

export const store = configureStore({
  reducer: {
    envy: envyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
