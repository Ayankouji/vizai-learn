import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Check, Lightbulb, PenLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LessonPlayer } from "@/components/explainer/LessonPlayer";
import type { Lesson, VisualizeRequest } from "@/lib/visualize-schema";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Visual Explainer — Learn Any Topic Visually" },
      {
        name: "description",
        content:
          "Type any educational topic and watch an AI teacher draw the perfect diagram, flowchart, timeline or graph and explain it step by step.",
      },
      { property: "og:title", content: "AI Visual Explainer — Learn Any Topic Visually" },
      {
        property: "og:description",
        content: "An AI teacher that draws and explains any topic step by step on an interactive digital textbook.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SUBJECTS = ["Science", "Biology", "Chemistry", "Physics", "Mathematics", "Computer Science", "History", "Geography", "Economics", "English", "Other"];
const GRADES = ["Grade 3–5", "Grade 6–8", "Grade 9–10", "Grade 11–12", "Undergraduate", "Adult learner"];
const STYLES: { value: VisualizeRequest["explanation"]; label: string }[] = [
  { value: "simple", label: "Simple & clear" },
  { value: "detailed", label: "Detailed" },
  { value: "real_world_examples", label: "Real-world examples" },
  { value: "exam_focused", label: "Exam focused" },
  { value: "story_analogy", label: "Story / analogy" },
];
const EXAMPLES = [
  { topic: "Photosynthesis", subject: "Biology" },
  { topic: "Pythagorean theorem", subject: "Mathematics" },
  { topic: "How binary search works", subject: "Computer Science" },
  { topic: "The water cycle", subject: "Geography" },
  { topic: "Causes of World War I", subject: "History" },
  { topic: "Supply and demand", subject: "Economics" },
];

async function visualize(input: VisualizeRequest): Promise<Lesson> {
  const res = await fetch("/api/visualize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as { lesson?: Lesson; error?: string };
  if (!res.ok || !data.lesson) throw new Error(data.error ?? "Something went wrong.");
  return data.lesson;
}

function Index() {
  const [form, setForm] = useState<VisualizeRequest>({
    topic: "",
    subject: "Science",
    grade: "Grade 6–8",
    explanation: "simple",
  });
  const mutation = useMutation({ mutationFn: visualize });
  const lesson = mutation.data;

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (form.topic.trim().length < 2) return;
    mutation.mutate(form);
  };

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-paper">
            <PenLine className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Visual Explainer</span>
        </div>
        <span className="hidden font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase sm:block">
          interactive digital textbook
        </span>
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-12 pb-8">
        {!lesson && !mutation.isPending && (
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
              Type any topic.
              <br />
              <span className="highlight-mark">Watch it get drawn</span> and taught.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
              An AI teacher picks the best visual — diagram, flowchart, timeline, graph, concept map — then
              animates and explains it step by step.
            </p>
          </div>
        )}

        <form
          onSubmit={submit}
          className={cn(
            "mx-auto mt-8 grid max-w-4xl gap-3 rounded-2xl border bg-card p-4 shadow-paper sm:grid-cols-[1.6fr_1fr_1fr_1fr_auto] sm:items-end",
            lesson && "mt-0",
          )}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="topic" className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
              Topic
            </Label>
            <Input
              id="topic"
              placeholder="e.g. How vaccines train the immune system"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className="h-11 text-base"
              autoFocus
            />
          </div>
          <Field label="Subject">
            <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
              <SelectTrigger className="h-11!"><SelectValue /></SelectTrigger>
              <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Grade">
            <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
              <SelectTrigger className="h-11!"><SelectValue /></SelectTrigger>
              <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Explanation">
            <Select
              value={form.explanation}
              onValueChange={(v) => setForm({ ...form, explanation: v as VisualizeRequest["explanation"] })}
            >
              <SelectTrigger className="h-11!"><SelectValue /></SelectTrigger>
              <SelectContent>{STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Button type="submit" size="lg" className="h-11" disabled={mutation.isPending || form.topic.trim().length < 2}>
            {mutation.isPending ? "Drawing…" : "Explain"} <ArrowRight />
          </Button>
        </form>

        {!lesson && !mutation.isPending && (
          <div className="mx-auto mt-5 flex max-w-4xl flex-wrap justify-center gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.topic}
                type="button"
                onClick={() => {
                  const next = { ...form, topic: ex.topic, subject: ex.subject };
                  setForm(next);
                  mutation.mutate(next);
                }}
                className="rounded-full border bg-card px-3.5 py-1.5 text-sm text-foreground/80 transition-colors hover:border-primary hover:text-primary"
              >
                {ex.topic}
              </button>
            ))}
          </div>
        )}

        {mutation.isError && (
          <div className="mx-auto mt-5 flex max-w-4xl items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <X className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p>{(mutation.error as Error).message}</p>
          </div>
        )}

        {mutation.isPending && <Sketching topic={form.topic} />}

        {lesson && !mutation.isPending && (
          <div key={lesson.title} className="animate-fade-up mt-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
                  {form.subject} · {form.grade}
                </p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{lesson.title}</h2>
              </div>
              <p className="max-w-md rounded-lg border border-dashed bg-card px-3 py-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Why a {lesson.visualType.replace(/_/g, " ")}?</span>{" "}
                {lesson.whyThisVisual}
              </p>
            </div>

            <LessonPlayer lesson={lesson} />

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border bg-card p-6 shadow-paper">
                <h3 className="flex items-center gap-2 text-xl">
                  <Lightbulb className="size-5 text-node-2" /> Key takeaways
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {lesson.keyTakeaways.map((t, i) => (
                    <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent font-mono text-[11px]">
                        {i + 1}
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              {lesson.quiz && <Quiz quiz={lesson.quiz} />}
            </div>

            <p className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="size-4" /> {lesson.summary}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">{label}</Label>
      {children}
    </div>
  );
}

function Sketching({ topic }: { topic: string }) {
  return (
    <div className="paper-grid mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border shadow-paper">
      <svg viewBox="0 0 1000 400" className="w-full">
        {[
          "M 120 200 Q 300 80 480 200",
          "M 480 200 Q 660 320 840 200",
          "M 200 300 L 500 300 L 800 300",
        ].map((d, i) => (
          <path
            key={i}
            d={d}
            pathLength={1}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={3}
            strokeLinecap="round"
            className="sketch-line"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
        {[120, 480, 840].map((x, i) => (
          <circle key={x} cx={x} cy={200} r={26} fill="var(--color-card)" stroke="var(--color-ink-soft)" strokeWidth={2} strokeDasharray="1" pathLength={1} className="sketch-line" style={{ animationDelay: `${i * 0.4}s` }} />
        ))}
      </svg>
      <div className="border-t bg-card/80 px-6 py-4 text-center">
        <p className="font-medium">The AI teacher is sketching “{topic}”…</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">choosing the visual · placing parts · writing each step</p>
      </div>
    </div>
  );
}

function Quiz({ quiz }: { quiz: NonNullable<Lesson["quiz"]> }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-paper">
      <h3 className="text-xl">Quick check</h3>
      <p className="mt-2 text-[15px] leading-relaxed">{quiz.question}</p>
      <div className="mt-4 grid gap-2">
        {quiz.options.map((o, i) => {
          const isAnswer = i === quiz.answerIndex;
          const state = picked === null ? "idle" : isAnswer ? "right" : picked === i ? "wrong" : "idle";
          return (
            <button
              key={i}
              type="button"
              disabled={picked !== null}
              onClick={() => setPicked(i)}
              className={cn(
                "flex items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                state === "idle" && "hover:border-primary",
                state === "right" && "border-node-4 bg-node-4/10",
                state === "wrong" && "border-destructive bg-destructive/10",
              )}
            >
              <span>{o}</span>
              {state === "right" && <Check className="size-4 text-node-4" />}
              {state === "wrong" && <X className="size-4 text-destructive" />}
            </button>
          );
        })}
      </div>
      {picked !== null && <p className="animate-fade-up mt-3 text-sm text-muted-foreground">{quiz.explanation}</p>}
    </div>
  );
}
