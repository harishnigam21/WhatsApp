import { RootState } from "./Store";
import { listenerMiddleware } from "./listenerMiddleware";
import { addReceiverMessage } from "./slices/ChatSlice";
import { sendSocketRequest } from "./slices/SocketSlice";
listenerMiddleware.startListening({
  actionCreator: addReceiverMessage,

  effect: async (action, listenerApi) => {
    const { data } = action.payload;
    const state = listenerApi.getState() as RootState;
    if (state.chat.selectedContact?._id == data.sender_id) {
      listenerApi.dispatch(
        sendSocketRequest({
          event: "seen",
          data: {
            msg_id: data._id,
            sender_id: data.sender_id,
            receiver_id: data.receiver_id,
          },
        }),
      );
    }
  },
});
