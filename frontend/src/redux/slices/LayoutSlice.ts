import { createSlice, PayloadAction } from "@reduxjs/toolkit";
interface screenSizeType {
  width: number;
  height: number;
}
interface stateProps {
  screenSize: screenSizeType;
  headerHeight: number | null;
  hideHeader: boolean;
  mainLayout: {
    sidebar: boolean;
    leftpart: boolean;
    rightpart: boolean;
  };
}
const initialState: stateProps = {
  screenSize: {
    width: 0,
    height: 0,
  },
  headerHeight: null,
  hideHeader: false,
  mainLayout: {
    sidebar: true,
    leftpart: true,
    rightpart: true,
  },
};
const LayoutSlice = createSlice({
  name: "mainLayout",
  initialState,
  reducers: {
    setScreenSize: (state, action: PayloadAction<screenSizeType>) => {
      state.screenSize = action.payload;
    },
    setHeaderHeight: (state, action: PayloadAction<number | null>) => {
      state.headerHeight = action.payload;
    },
    setHideHeader: (state, action: PayloadAction<boolean>) => {
      state.hideHeader = action.payload;
    },
    updateMainLayout: (
      state,
      action: PayloadAction<{
        sidebar: boolean;
        leftpart: boolean;
        rightpart: boolean;
      }>,
    ) => {
      state.mainLayout = action.payload;
    },
  },
});
export default LayoutSlice.reducer;
export const {
  setScreenSize,
  setHeaderHeight,
  setHideHeader,
  updateMainLayout,
} = LayoutSlice.actions;
