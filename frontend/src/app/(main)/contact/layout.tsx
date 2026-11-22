import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_PROJECT_NAME} | Add Contact`,
  description: `Add Contact and Start Chatting effortlessly`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <section className="grow flex items-center justify-center p-1 bg-[color-mix(in_srgb,var(--color-bgpri)_10%,var(--color-bgsec)_100%)]">
      {children}
    </section>
  );
}
