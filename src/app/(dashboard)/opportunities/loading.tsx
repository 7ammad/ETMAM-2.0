export default function OpportunitiesLoading() {
  return (
    <main className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="h-8 w-32 skeleton rounded-lg" />
      <div className="grid gap-4 grid-cols-5">
        <div className="col-span-5 sm:col-span-2 h-24 skeleton rounded-xl" />
        <div className="col-span-5 sm:col-span-3 grid grid-cols-3 gap-4">
          <div className="h-24 skeleton rounded-xl" />
          <div className="h-24 skeleton rounded-xl" />
          <div className="h-24 skeleton rounded-xl" />
        </div>
      </div>
      <div className="h-64 skeleton rounded-xl" />
    </main>
  );
}
