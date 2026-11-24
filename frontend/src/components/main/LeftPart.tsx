"use client";

import { useAppSelector } from "@/redux/Store";
import React, { useEffect, useState } from "react";
import ActiveContact from "./ActiveContact";
import Contact from "./Contact";
import { usePathname } from "next/navigation";

export default function LeftPart({
  sidebarpop,
  setSidebarPop,
}: {
  sidebarpop: boolean;
  setSidebarPop: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [searchFocus, setSearcFocus] = useState<boolean>(false);
  const [showContact, setShowContact] = useState<boolean>(false);
  const mainLayout = useAppSelector((store) => store.layout.mainLayout);
  const [options, setOptions] = useState<boolean>(false);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname == "/contact") {
      setShowContact(true);  
    }
  }, [pathname]);
  return (
    <section
      className={`${mainLayout.leftpart ? `relative ${!mainLayout.rightpart ? "w-full" : "min-w-90 lg:min-w-115"} min-h-full bg-bgsec/40 border-r border-borderhl/40 z-10 flex flex-col` : "hidden"}`}
      onContextMenu={(e) => {
        e.preventDefault();
        setOptions(true);
      }}
    >
      {/* Contact*/}
      <Contact
        showContact={showContact}
        setShowContact={setShowContact}
        searchFocus={searchFocus}
        setSearcFocus={setSearcFocus}
      />
      {/* Active contact */}
      <ActiveContact
        options={options}
        setOptions={setOptions}
        searchFocus={searchFocus}
        setSearcFocus={setSearcFocus}
        setShowContact={setShowContact}
        sidebarpop={sidebarpop}
        setSidebarPop={setSidebarPop}
        mainLayout={mainLayout}
      />
    </section>
  );
}
