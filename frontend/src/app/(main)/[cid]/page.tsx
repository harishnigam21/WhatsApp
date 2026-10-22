import MessageList from "@/components/chat/MessageList";
import delay from "@/utils/delay";

export default async function Chat() {
  await delay(1000);
  return <MessageList />;
}
