import HorizontalBar from "@/components/loader/HorizontalBar";

export default function Loading() {
  return (
    <section className="grow w-full overflow-x-hidden relative">
      <HorizontalBar />
      <section className="bg-[color-mix(in_srgb,var(--color-bgpri)_10%,var(--color-bgsec)_100%)] min-w-full min-h-full animate-pulse"></section>
    </section>
  );
}
