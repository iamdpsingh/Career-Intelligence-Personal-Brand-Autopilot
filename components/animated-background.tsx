export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-[-1] bg-zinc-50 dark:bg-zinc-950 overflow-hidden pointer-events-none">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-400/30 dark:bg-orange-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-lime-400/30 dark:bg-lime-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-amber-400/20 dark:bg-amber-600/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
    </div>
  );
}
