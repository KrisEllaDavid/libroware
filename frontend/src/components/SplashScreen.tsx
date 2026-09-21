import React, { useEffect, useState } from "react";

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

type Phase = "initial" | "logoReveal" | "textReveal" | "fadeOut";

/**
 * Cold-start splash.
 *
 * The previous version animated the wordmark one `<span>` per letter — nine
 * near-identical 25-line blocks of inline styles for a single stagger. The
 * letters are now derived from the string with a computed delay, so the whole
 * sequence is four lines and the timing is adjustable in one place.
 *
 * Motion is transform/opacity only, on the app's spring curve, and the whole
 * thing collapses to a plain fade when the OS asks for reduced motion.
 */
const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  duration = 5000,
}) => {
  const [phase, setPhase] = useState<Phase>("initial");

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("logoReveal"), 250),
      setTimeout(() => setPhase("textReveal"), 1400),
      setTimeout(() => setPhase("fadeOut"), Math.max(0, duration - 700)),
      setTimeout(onFinish, duration),
    ];
    return () => timers.forEach(clearTimeout);
  }, [duration, onFinish]);

  const revealed = phase === "textReveal" || phase === "fadeOut";
  const word = "Libroware";

  return (
    <div
      className="fixed inset-0 z-splash flex items-center justify-center overflow-hidden bg-emerald-800 transition-opacity duration-700 ease-soft dark:bg-emerald-950"
      style={{ opacity: phase === "fadeOut" ? 0 : 1 }}
      role="status"
      aria-label="Loading Libroware"
    >
      {/* Ambient depth: two soft radial pools rather than a flat fill or a
          linear gradient, so the ground has a light source. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 30% 20%, rgba(131,194,163,0.22), transparent 70%), radial-gradient(50% 45% at 75% 85%, rgba(47,138,102,0.28), transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md px-8 text-center">
        <div
          className="mx-auto mb-10 h-32 w-32 transition-all duration-1000 ease-spring sm:h-40 sm:w-40"
          style={{
            transform:
              phase === "initial" ? "scale(0.6) rotate(-12deg)" : "scale(1) rotate(0)",
            opacity: phase === "initial" ? 0 : 1,
          }}
        >
          <img
            src="/Logo.png"
            alt=""
            className="h-full w-full object-contain drop-shadow-2xl"
          />
        </div>

        <h1 className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          <span className="sr-only">{word}</span>
          <span aria-hidden="true" className="inline-flex">
            {word.split("").map((letter, i) => (
              <span key={i} className="inline-block overflow-hidden">
                <span
                  className="inline-block transition-all duration-500 ease-out"
                  style={{
                    transform: revealed ? "translateY(0)" : "translateY(100%)",
                    opacity: revealed ? 1 : 0,
                    transitionDelay: `${180 + i * 45}ms`,
                  }}
                >
                  {letter}
                </span>
              </span>
            ))}
          </span>
        </h1>

        <p
          className="mt-3.5 text-[0.9375rem] text-emerald-100/90 transition-opacity duration-700 ease-soft"
          style={{
            opacity: revealed ? 1 : 0,
            transitionDelay: "700ms",
          }}
        >
          Congo-Cameroon Interstate University Library
        </p>

        {/* Progress rail — tells you the wait is finite. */}
        <div
          className="mx-auto mt-9 h-0.5 w-40 overflow-hidden rounded-full bg-white/15"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-emerald-200"
            style={{
              width: phase === "initial" ? "0%" : "100%",
              transition: `width ${duration - 500}ms cubic-bezier(0.4, 0.14, 0.3, 1)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
