import { ArrowLeft } from "lucide-react";

export default function Loading() {
  return (
    <section className="flex flex-col gap-1 w-full h-screen grow overflow-hidden">
      {/* heading */}
      <div className="w-full box-border py-3 px-1 sm:px-4 flex flex-nowrap justify-between gap-1 h-16 bg-bgsec/40">
        <div className="flex flex-nowrap gap-3 items-center whitespace-nowrap">
          <div
            title="go back"
            className="flex md:hidden justify-center items-center cursor-pointer"
          >
            <ArrowLeft size={20} className="scale-x-125 animate-pulse" />
          </div>
          <div className="size-10 aspect-square rounded-full overflow-hidden bg-bgsec animate-pulse"></div>
          <div className="self-center flex flex-col gap-1">
            <div className="font-bold w-30 h-5 animate-pulse bg-bgsec"></div>
            <div className="text-[10px] w-15 h-2 bg-bgsec animate-pulse"></div>
          </div>
        </div>
        <div className="flex-nowrap gap-3 flex items-center">
          {Array.from({ length: 4 }).map((item, i) => (
            <div
              key={`rightbar/up_part/icon-skeleton/${i}`}
              className="hover:bg-borderhl/30 active:bg-borderhl/30 rounded-full p-2.5 cursor-pointer transition-all hidden min-[480px]:block animate-pulse size-8 bg-bgsec"
            ></div>
          ))}
        </div>
      </div>
      {/* body */}
      <div className="grow py-2 px-4 md:px:16 flex flex-col justify-end">
        {Array.from({ length: 10 }).map((item, i) => (
          <div
            key={`skeleton/message/${i}`}
            className={`py-1 px-1.5 rounded-md flex flex-nowrap justify-center min-w-30 max-w-1/2 min-h-10 max-h-10 ${i % 2 == 0 ? "self-end bg-[color-mix(in_srgb,var(--color-bgpri)_50%,var(--color-pri)_50%)] delay-150" : "self-start bg-bgsec"} animate-pulse transition-all`}
          ></div>
        ))}
      </div>
      {/* input */}
      <div className="w-full p-4">
        <div className="w-full h-12 rounded-full bg-bgsec animate-pulse"></div>
      </div>
    </section>
  );
}
