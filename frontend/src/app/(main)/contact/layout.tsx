import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_PROJECT_NAME} | Add Contact`,
  description: `Add Contact and Start Chatting effortlessly`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return children;
}
