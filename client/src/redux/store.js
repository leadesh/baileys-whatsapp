import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./user/userSlice.js";
import socketReducer from "./socket/socketSlice.js";

export const store = configureStore({
  reducer: {
    user: userReducer,
    socket: socketReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: true,
    }),
});
