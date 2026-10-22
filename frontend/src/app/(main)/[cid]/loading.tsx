export default function Loading() {
  return (
    <section className="flex flex-col gap-1 w-full py-8 px-16 grow max-h-full overflow-hidden">
      {Array.from({ length: 30 }).map((item, i) => (
        <div
          key={`skeleton/message/${i}`}
          className={`py-1 px-1.5 rounded-md flex flex-nowrap justify-center min-w-30 max-w-1/2 min-h-10 max-h-10 ${i % 2 == 0 ? "self-end bg-[color-mix(in_srgb,var(--color-bgpri)_50%,var(--color-pri)_50%)] delay-150" : "self-start bg-bgsec"} animate-pulse transition-all`}
        ></div>
      ))}
    </section>
  );
}
