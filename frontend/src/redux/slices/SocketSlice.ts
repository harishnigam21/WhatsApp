import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface stateProps {
  isConnected: boolean;
}

const initialState: stateProps = {
  isConnected: false,
};
const SocketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    sendSocketRequest: (
      state,
      action: PayloadAction<{
        event: string;
        data: unknown;
      }>,
    ) => {},
  },
});
export const { setConnectionStatus, sendSocketRequest } = SocketSlice.actions;
export default SocketSlice.reducer;
