import Shell from "@/components/chat/Shell";
import RightPart from "@/components/main/RightPart";
import { selectedContactType } from "@/redux/slices/ChatSlice";
import { serverFetch } from "@/utils/serverApi";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cid: string }>;
}): Promise<Metadata> {
  const { cid } = await params;
  const rawChatId = typeof cid === "string" ? cid : "";
  const decodedChatId = rawChatId ? decodeURIComponent(rawChatId) : "";
  const id = decodedChatId.startsWith("c=")
    ? decodedChatId.replace("c=", "")
    : decodedChatId;
  const responseChat = await serverFetch(`api/users/meta/${id}`, "GET");
  const responseData = responseChat.data as {
    sender: string;
    receiver: string;
  };
  if (responseData.receiver && responseData.sender) {
    return {
      title: `${process.env.NEXT_PUBLIC_PROJECT_NAME} | ${responseData.receiver}`,
      description: `${responseData.sender} chatting with ${responseData.receiver} via ${process.env.NEXT_PUBLIC_PROJECT_NAME}`,
    };
  } else {
    return {
      title: `Chat | ${process.env.NEXT_PUBLIC_PROJECT_NAME}`,
      description: `User chatting with ${process.env.NEXT_PUBLIC_PROJECT_NAME}`,
    };
  }
}
export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ cid: string }>;
}>) {
  const { cid } = await params;
  const rawChatId = typeof cid === "string" ? cid : "";
  const decodedChatId = rawChatId ? decodeURIComponent(rawChatId) : "";
  const id = decodedChatId.startsWith("c=")
    ? decodedChatId.replace("c=", "")
    : decodedChatId;
  const responseChat = await serverFetch(`api/chat/${id}`, "GET");
  const dataChat = responseChat.data as selectedContactType;
  return (
    <>
      <Shell dataChat={dataChat} />
      <RightPart>{children}</RightPart>
    </>
  );
}
