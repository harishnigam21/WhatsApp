import { configureStore } from "@reduxjs/toolkit";
import UserSlice from "./slices/UserSlice";
import SelectedUserSlice from "./slices/SelectedUserSlice";
const Store = configureStore({
  reducer: {
    user: UserSlice,
    selectedUser: SelectedUserSlice,
  },
});
export default Store;
