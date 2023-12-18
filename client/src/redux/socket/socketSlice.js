import { createSlice } from "@reduxjs/toolkit";

const initialSocketState = {
  socketValue: null,
};

const socketSlice = createSlice({
  name: "socket",
  initialState: initialSocketState,
  reducers: {
    setNewSocket: (state, action) => {
      state.socketValue = action.payload;
    },
  },
});

export const { setNewSocket } = socketSlice.actions;

export default socketSlice.reducer;
