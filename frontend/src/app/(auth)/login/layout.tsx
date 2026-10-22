import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Login | ${process.env.NEXT_PUBLIC_PROJECT_NAME}`,
  description: `Login to continue`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
