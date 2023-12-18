import { createSlice } from "@reduxjs/toolkit";

const initialUserState = {
  currentUser: null,
};

const userSlice = createSlice({
  name: "user",
  initialState: initialUserState,
  reducers: {
    signInSuccess: (state, action) => {
      state.currentUser = action.payload;
    },
    signOutSuccess: (state) => {
      state.currentUser = null;
    },
  },
});

export const { signInSuccess, signOutSuccess } = userSlice.actions;

export default userSlice.reducer;
