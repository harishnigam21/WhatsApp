import useApi from "@/hooks/useApi";
import {
  clearSelectionFor,
  deleteMsg,
  setSelectedFor,
} from "@/redux/slices/ChatSlice";
import { useAppSelector } from "@/redux/Store";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

export const handleDeleteMessage = () => {
  const dispatch = useDispatch();
  const { sendRequest, loading } = useApi();
  const selectedContact = useAppSelector(
    (item) => item.chat.selectedContact?._id,
  );
  const handleDelete = async (ids: string[]) => {
    if (ids.length == 0 || !selectedContact) return;
    try {
      sendRequest(`api/message/${selectedContact}`, "DELETE", { ids }).then(
        (result) => {
          const data = result.data as {
            _id: string;
            deletedFor: boolean;
            inTrash: boolean;
            deletedForEveryone: boolean;
            content: string;
            attachments: any[];
          }[];
          if (result && result.success) {
            dispatch(deleteMsg(data));
            dispatch(clearSelectionFor());
            dispatch(setSelectedFor(false));
          } else {
            throw new Error("Failed to delete");
          }
        },
      );
    } catch (error) {
      let msg = "Failed to delete";
      if (error instanceof Error) msg = error.message;
      toast.error(msg);
    }
  };

  return { handleDelete, loading };
};
