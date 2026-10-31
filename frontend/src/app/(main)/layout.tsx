import { serverFetch } from "@/utils/serverApi";
import "../globals.css";
import { User } from "@/redux/slices/UserSlice";
import MainLayoutData from "@/components/main/MainLayoutData";
import { ActiveContact, Contact } from "@/redux/slices/ChatSlice";
import MainLayout from "@/components/main/MainLayout";
import ScreenSize from "@/components/ScreenSize";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const responseUser = await serverFetch(`api/users`, "GET");
  const responseContacts = await serverFetch(`api/users/contacts`, "GET");
  const responseActiveContacts = await serverFetch(
    `api/users/active-contacts`,
    "GET",
  );
  const dataUser = responseUser.data as { user: User };
  const dataContacts = responseContacts.data as Contact[];
  const dataActiveContacts = responseActiveContacts.data as ActiveContact[];

  return (
    <article className="flex grow flex-col text-txpri bg-bgpri">
      <ScreenSize />
      <MainLayoutData
        dataUser={dataUser?.user || null}
        dataContacts={dataContacts}
        dataActiveContacts={dataActiveContacts}
      />
      <MainLayout children={children}></MainLayout>
    </article>
  );
}
