import useApi from "@/hooks/useApi";
import { MessageType, nextMessages } from "@/redux/slices/ChatSlice";
import { useAppSelector } from "@/redux/Store";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

export const NextMessages = () => {
  const dispatch = useDispatch();
  const { sendRequest, loading } = useApi();
  const selectedContact = useAppSelector((store) => store.chat.selectedContact);

  const handleNextMessages = async () => {
    if (!selectedContact) return;
    if (!selectedContact.next) {
      toast.error("no more previous messages");
      return;
    }
    const beforeLoading = selectedContact.messages[0];
    try {
      sendRequest(
        `api/chat/${selectedContact._id}?cursor=${selectedContact.next}`,
      ).then((result) => {
        const data = result.data as { messages: MessageType[]; next: string };
        if (result && result.success) {
          dispatch(nextMessages(data));
          const targetId = document.getElementById(
            `message/${beforeLoading._id}`,
          );
          if (targetId) targetId.scrollIntoView();
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  return { handleNextMessages, loading };
};
