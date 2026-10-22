import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  phoneCode: string;
  pic: string | null;
  banner: string | null;
  bio: string;
  lastOnline: Date;
  followers: string[];
  following: string[];
}

interface stateProps {
  userInfo: User | null;
  loginStatus: "loading" | "unauthenticated" | "authenticated";
}

const initialState: stateProps = {
  userInfo: null,
  loginStatus: "loading",
};
const UserSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      const data = action.payload;
      state.userInfo = data;
    },
    setLoginStatus: (
      state,
      action: PayloadAction<"loading" | "unauthenticated" | "authenticated">,
    ) => {
      state.loginStatus = action.payload;
    },
  },
});
export const { setUser, setLoginStatus } = UserSlice.actions;
export default UserSlice.reducer;
