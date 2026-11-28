import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_PROJECT_NAME} | Sync Contact`,
  description: `Now you can sync contact from any other device, no need of transfer contact through different platforms.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return children;
}
