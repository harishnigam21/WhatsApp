import { createSlice, PayloadAction } from "@reduxjs/toolkit";
export interface DeviceMetadata {
  thumbmark: string;
  model: string | null;
  platform: string | null;
  isMobile: boolean;
  brands: { browser: string; version: string };
  timezone: string;
}
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
export interface ContactSyncSession {
  sessionId: string;
  syncURL: string;
  expiresAt: string;
}
interface stateProps {
  userInfo: User | null;
  loginStatus: "loading" | "unauthenticated" | "authenticated";
  QRSession: ContactSyncSession | null;
  QRparticipants: DeviceMetadata[];
}

const initialState: stateProps = {
  userInfo: null,
  loginStatus: "loading",
  QRSession: null,
  QRparticipants: [],
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
    addQRparticipants: (state, action: PayloadAction<DeviceMetadata>) => {
      const newP = action.payload;
      const findExisting = state.QRparticipants.findIndex(
        (item) => item.thumbmark === newP.thumbmark,
      );
      if (findExisting === -1) {
        state.QRparticipants.unshift(newP);
      }
    },
    clearQRparticipants: (state) => {
      state.QRparticipants = [];
    },
    removeQRparticipants: (state, action: PayloadAction<string>) => {
      const thumbmark = action.payload;
      state.QRparticipants = state.QRparticipants.filter(
        (item) => item.thumbmark !== thumbmark,
      );
    },
    setQRSession: (state, action: PayloadAction<ContactSyncSession | null>) => {
      state.QRSession = action.payload;
    },
  },
});
export const {
  setUser,
  setLoginStatus,
  addQRparticipants,
  removeQRparticipants,
  setQRSession,
  clearQRparticipants,
} = UserSlice.actions;
export default UserSlice.reducer;
