import { ChevronDown, EllipsisVertical, Globe } from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";
import { useEffect, useRef, useState } from "react";

export default function Welcome({
  setAgree,
}: {
  setAgree: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [menu, setMenu] = useState<boolean>(false);
  const menuRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <section className="relative text-txpri w-full grow grid grid-cols-1 md:grid-cols-2 p-2 md:p-4 lg:p-8">
      <div className="w-full flex items-center-safe justify-center-safe">
        <AnimatedLogo />
      </div>
      <div className="w-full flex flex-col items-center-safe justify-center-safe">
        <style>{`span {cursor:pointer;white-space: nowrap;}`}</style>
        <h3 className="text-3xl sm:text-4xl mb-8 text-center">
          Welcome to WhatsApp
        </h3>
        <p className="text-sm sm:text-lg text-center">
          Read our{" "}
          <span className="text-pri font-medium">Privacy Policies</span>. Tap
          "Agree and continue" to accept our{" "}
          <span className="text-pri font-medium">Terms of service</span>.
          WhatsApp will verify your account and may send account-related SMS
          messages. <span className="text-pri font-medium">Learn more</span>
        </p>
        <button className="flex gap-2 items-center rounded-full py-3 px-4 cursor-pointer mt-8 bg-borderhl">
          <Globe size={25} />
          <p className="text-lg -mt-1">English</p>
          <ChevronDown size={14} className="" />
        </button>
        <button
          className="flex rounded-full bg-pri mt-8 py-3 px-8 text-lg cursor-pointer"
          onClick={() => setAgree(true)}
        >
          Agree and Continue
        </button>
      </div>
      <div className="fixed top-4 right-4">
        <button
          className="flex items-center cursor-pointer p-2 rounded-full hover:bg-bgsec/80 active:bg-bgsec/80 transition-all"
          onClick={() => setMenu((prev) => !prev)}
        >
          <EllipsisVertical strokeWidth={3} size={30} />
        </button>
        {menu && (
          <li
            ref={menuRef}
            className="fixed top-15 right-4 bg-bgsec rounded-2xl border border-borderhl list-none w-30 overflow-hidden"
          >
            <ol className="px-3 py-1.5 cursor-pointer hover:bg-borderhl active:bg-borderhl transition-all">
              Help
            </ol>
          </li>
        )}
      </div>
    </section>
  );
}
