import { LockKeyhole } from "lucide-react";
import WhatsAppIcon from "../WhatsAppIcon";

export default function WhatsAppLoading() {
  return (
    <section className="w-full grow flex justify-center items-center">
      <article className="flex flex-col gap-2 w-50 whitespace-nowrap justify-center items-center">
        <div className="size-15">
          <WhatsAppIcon color="#4d4d4d" />
        </div>

        <h3 className="text-xl tracking-tighter">
          {process.env.NEXT_PUBLIC_PROJECT_NAME}
        </h3>

        <div className="w-full h-1 rounded-full my-3 bg-white/15 overflow-hidden">
          <div className="h-full bg-pri loading-progress" />
        </div>

        <div className="px-6 flex flex-nowrap gap-1 items-center text-txpri/60">
          <LockKeyhole size={16} className="mt-1" />

          <p className="text-[16px] tracking-tighter">End-to-end encrypted</p>
        </div>
      </article>
    </section>
  );
}
