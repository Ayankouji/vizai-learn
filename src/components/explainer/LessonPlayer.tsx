import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import type { Lesson } from "@/lib/visualize-schema";
import { VisualCanvas } from "./VisualCanvas";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useTypewriter(text: string, speed = 14) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setShown("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { shown, done };
}

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const total = lesson.steps.length;
  const current = lesson.steps[step]!;
  const { shown, done } = useTypewriter(current.explanation);

  const next = useCallback(() => setStep((s) => Math.min(total - 1, s + 1)), [total]);
  const prev = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  // Autoplay: advance a beat after the teacher finishes "speaking".
  useEffect(() => {
    if (!playing || !done) return;
    if (step >= total - 1) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(next, 2600);
    return () => clearTimeout(id);
  }, [playing, done, step, total, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
      {/* Canvas */}
      <div className="paper-grid relative overflow-hidden rounded-2xl border shadow-paper">
        <VisualCanvas lesson={lesson} step={step} />
        {/* Progress strip */}
        <div className="absolute inset-x-0 bottom-0 flex h-1.5 gap-0.5 px-0.5 pb-0.5">
          {lesson.steps.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to step ${i + 1}`}
              onClick={() => setStep(i)}
              className={cn(
                "h-full flex-1 rounded-full transition-colors",
                i < step ? "bg-primary/60" : i === step ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>
      </div>

      {/* Teacher panel */}
      <aside className="flex flex-col rounded-2xl border bg-card p-5 shadow-paper">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
            Step {step + 1} of {total}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 font-mono text-[11px] text-accent-foreground">
            <Sparkles className="size-3" /> AI teacher
          </span>
        </div>

        <h3 key={`t-${step}`} className="animate-fade-up mt-3 text-2xl leading-tight">
          {current.title}
        </h3>

        <p className="mt-3 min-h-[7.5rem] text-[15px] leading-relaxed text-foreground/90">
          {shown}
          {!done && <span className="animate-blink ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-primary" />}
        </p>

        {current.formula && (
          <div key={`f-${step}`} className="animate-fade-up mt-2 rounded-lg border border-dashed bg-paper-deep px-4 py-3 font-mono text-sm">
            {current.formula}
          </div>
        )}

        <div className="mt-auto pt-5">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prev} disabled={step === 0} aria-label="Previous step">
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (step >= total - 1) {
                  setStep(0);
                  setPlaying(true);
                } else setPlaying((p) => !p);
              }}
              aria-label={playing ? "Pause" : "Play"}
            >
              {step >= total - 1 && !playing ? <RotateCcw /> : playing ? <Pause /> : <Play />}
            </Button>
            <Button className="flex-1" onClick={next} disabled={step >= total - 1}>
              Next step <ChevronRight />
            </Button>
          </div>
          <p className="mt-2 text-center font-mono text-[11px] text-muted-foreground">
            ← → to navigate · space to pause
          </p>
        </div>
      </aside>
    </div>
  );
}
