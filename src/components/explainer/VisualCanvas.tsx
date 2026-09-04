import { useMemo } from "react";
import type { Lesson, LessonNode } from "@/lib/visualize-schema";

const W = 1000;
const H = 625;
const PAD_X = 80;
const PAD_TOP = 70;
const PAD_BOTTOM = 55;

type ElementState = "hidden" | "active" | "seen";

interface Placed extends LessonNode {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

function place(node: LessonNode): Placed {
  const cx = PAD_X + (node.x / 100) * (W - PAD_X * 2);
  const cy = PAD_TOP + (node.y / 100) * (H - PAD_TOP - PAD_BOTTOM);
  const textLen = Math.max(node.label.length, (node.sublabel ?? "").length * 0.85);
  let w = Math.min(230, Math.max(112, textLen * 10.5 + 44));
  let h = node.sublabel ? 74 : 56;
  if (node.shape === "circle") {
    w = h = 92;
  } else if (node.shape === "diamond") {
    w = Math.max(w, 160);
    h = 96;
  } else if (node.shape === "cloud") {
    h += 10;
    w += 14;
  }
  return { ...node, cx, cy, w, h };
}

/** Point on the node boundary in the direction of (tx, ty). */
function boundary(n: Placed, tx: number, ty: number) {
  const dx = tx - n.cx;
  const dy = ty - n.cy;
  if (dx === 0 && dy === 0) return { x: n.cx, y: n.cy };
  if (n.shape === "circle") {
    const len = Math.hypot(dx, dy);
    const r = n.w / 2 + 4;
    return { x: n.cx + (dx / len) * r, y: n.cy + (dy / len) * r };
  }
  const hw = n.w / 2 + 5;
  const hh = n.h / 2 + 5;
  const scale = Math.min(hw / Math.abs(dx || 1e-6), hh / Math.abs(dy || 1e-6));
  return { x: n.cx + dx * scale, y: n.cy + dy * scale };
}

function firstAppearance(lesson: Lesson) {
  const map = new Map<string, number>();
  lesson.steps.forEach((s, i) => {
    [...s.highlightNodes, ...s.highlightEdges].forEach((id) => {
      if (!map.has(id)) map.set(id, i);
    });
  });
  return map;
}

interface Props {
  lesson: Lesson;
  step: number;
}

export function VisualCanvas({ lesson, step }: Props) {
  const placed = useMemo(() => normalize(lesson.nodes).map(place), [lesson.nodes]);
  const byId = useMemo(() => new Map(placed.map((n) => [n.id, n])), [placed]);
  const intro = useMemo(() => firstAppearance(lesson), [lesson]);
  const current = lesson.steps[step];
  const activeNodes = new Set(current?.highlightNodes ?? []);
  const activeEdges = new Set(current?.highlightEdges ?? []);

  const stateOf = (id: string, isActive: boolean): ElementState => {
    const at = intro.get(id);
    if (isActive) return "active";
    if (at === undefined) return "seen"; // never referenced → always visible
    return at <= step ? "seen" : "hidden";
  };
  const isNew = (id: string) => intro.get(id) === step;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full select-none"
      role="img"
      aria-label={`${lesson.title} — ${current?.title ?? ""}`}
    >
      <defs>
        <marker id="arrow-ink" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-ink-soft)" />
        </marker>
        <marker id="arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-primary)" />
        </marker>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="var(--color-primary)" floodOpacity="0.35" />
        </filter>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="var(--color-ink)" floodOpacity="0.12" />
        </filter>
      </defs>

      {lesson.chart && <Chart lesson={lesson} step={step} activeIds={activeNodes} stateOf={stateOf} />}

      {/* Edges */}
      <g>
        {lesson.edges.map((e) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          const st = stateOf(e.id, activeEdges.has(e.id));
          if (st === "hidden") return null;
          const p1 = boundary(a, b.cx, b.cy);
          const p2 = boundary(b, a.cx, a.cy);
          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2;
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.hypot(dx, dy) || 1;
          const bend = Math.min(40, len * 0.12);
          const cx = mx - (dy / len) * bend;
          const cy = my + (dx / len) * bend;
          const d = `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`;
          const lx = 0.25 * p1.x + 0.5 * cx + 0.25 * p2.x;
          const ly = 0.25 * p1.y + 0.5 * cy + 0.25 * p2.y;
          const active = st === "active";
          return (
            <g
              key={e.id}
              style={{ opacity: active ? 1 : 0.45, transition: "opacity 0.5s ease" }}
            >
              <path
                d={d}
                pathLength={1}
                fill="none"
                stroke={active ? "var(--color-primary)" : "var(--color-ink-soft)"}
                strokeWidth={active ? 3.5 : 2}
                strokeLinecap="round"
                strokeDasharray={e.style === "dashed" ? "0.05 0.03" : undefined}
                className={isNew(e.id) && step >= 0 ? "edge-draw" : undefined}
                markerEnd={`url(#${active ? "arrow-active" : "arrow-ink"})`}
                markerStart={e.bidirectional ? `url(#${active ? "arrow-active" : "arrow-ink"})` : undefined}
                style={{ transition: "stroke 0.4s ease, stroke-width 0.4s ease" }}
              />
              {e.label && (
                <g>
                  <rect
                    x={lx - e.label.length * 3.6 - 8}
                    y={ly - 11}
                    width={e.label.length * 7.2 + 16}
                    height={22}
                    rx={11}
                    fill="var(--color-card)"
                    stroke={active ? "var(--color-primary)" : "var(--color-border)"}
                  />
                  <text
                    x={lx}
                    y={ly + 4}
                    textAnchor="middle"
                    fontSize={12}
                    fontFamily="var(--font-mono)"
                    fill={active ? "var(--color-primary)" : "var(--color-ink-soft)"}
                  >
                    {e.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* Nodes */}
      <g>
        {placed.map((n) => {
          const st = stateOf(n.id, activeNodes.has(n.id));
          if (st === "hidden") return null;
          const active = st === "active";
          return <NodeShape key={n.id} n={n} active={active} fresh={isNew(n.id)} />;
        })}
      </g>

      {/* Annotation callout */}
      {current && (
        <foreignObject key={step} x={18} y={14} width={420} height={60}>
          <div className="animate-fade-up inline-flex max-w-full items-center gap-2 rounded-full border border-primary/40 bg-card/95 px-4 py-2 shadow-paper backdrop-blur">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary font-mono text-[11px] font-semibold text-primary-foreground">
              {step + 1}
            </span>
            <span className="truncate text-sm font-medium text-foreground">{current.annotation}</span>
          </div>
        </foreignObject>
      )}

      {/* Visual type stamp */}
      <text
        x={W - 22}
        y={H - 18}
        textAnchor="end"
        fontSize={11}
        fontFamily="var(--font-mono)"
        fill="var(--color-ink-soft)"
        opacity={0.7}
        letterSpacing={2}
      >
        {lesson.visualType.replace(/_/g, " ").toUpperCase()}
      </text>
    </svg>
  );
}

function NodeShape({ n, active, fresh }: { n: Placed; active: boolean; fresh: boolean }) {
  const color = `var(--node-${n.color})`;
  const fill = active
    ? `color-mix(in oklch, ${color} 22%, var(--color-card))`
    : `color-mix(in oklch, ${color} 9%, var(--color-card))`;
  const stroke = active ? color : `color-mix(in oklch, ${color} 55%, var(--color-border))`;
  const x = n.cx - n.w / 2;
  const y = n.cy - n.h / 2;

  let shape: React.ReactNode;
  const common = {
    fill,
    stroke,
    strokeWidth: active ? 3 : 2,
    style: { transition: "fill 0.4s ease, stroke 0.4s ease, stroke-width 0.3s ease" },
    filter: active ? "url(#glow)" : "url(#soft)",
  };
  switch (n.shape) {
    case "circle":
      shape = <circle cx={n.cx} cy={n.cy} r={n.w / 2} {...common} />;
      break;
    case "diamond":
      shape = (
        <polygon
          points={`${n.cx},${y} ${n.cx + n.w / 2},${n.cy} ${n.cx},${y + n.h} ${n.cx - n.w / 2},${n.cy}`}
          strokeLinejoin="round"
          {...common}
        />
      );
      break;
    case "pill":
      shape = <rect x={x} y={y} width={n.w} height={n.h} rx={n.h / 2} {...common} />;
      break;
    case "cloud":
      shape = (
        <rect x={x} y={y} width={n.w} height={n.h} rx={22} strokeDasharray="6 5" {...common} />
      );
      break;
    default:
      shape = <rect x={x} y={y} width={n.w} height={n.h} rx={12} {...common} />;
  }

  return (
    <g
      className={fresh ? "node-pop" : undefined}
      style={{ opacity: active ? 1 : 0.6, transition: "opacity 0.5s ease" }}
    >
      {active && (
        <rect
          x={x - 8}
          y={y - 8}
          width={n.w + 16}
          height={n.h + 16}
          rx={n.shape === "circle" ? (n.w + 16) / 2 : 18}
          fill="none"
          stroke={color}
          strokeWidth={2}
          className="node-pulse"
        />
      )}
      {shape}
      <foreignObject x={x} y={y} width={n.w} height={n.h} style={{ pointerEvents: "none" }}>
        <div className="flex h-full w-full flex-col items-center justify-center px-2 text-center leading-tight">
          <div className="flex items-center gap-1.5 text-[15px] font-semibold text-foreground">
            {n.icon && <span className="text-base leading-none">{n.icon}</span>}
            <span className="[text-wrap:balance]">{n.label}</span>
          </div>
          {n.sublabel && (
            <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{n.sublabel}</div>
          )}
        </div>
      </foreignObject>
    </g>
  );
}

function Chart({
  lesson,
  step,
  activeIds,
  stateOf,
}: {
  lesson: Lesson;
  step: number;
  activeIds: Set<string>;
  stateOf: (id: string, a: boolean) => ElementState;
}) {
  const chart = lesson.chart!;
  const hasNodes = lesson.nodes.length > 0;
  // Reserve the right third for nodes when both are present.
  const left = 90;
  const right = hasNodes ? W * 0.6 : W - 60;
  const top = 90;
  const bottom = H - 80;

  const all = chart.series.flatMap((s) => s.points);
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(...ys);
  const sx = (x: number) => left + ((x - minX) / (maxX - minX || 1)) * (right - left);
  const sy = (y: number) => bottom - ((y - minY) / (maxY - minY || 1)) * (bottom - top);
  const zeroY = sy(0);

  const ticks = 4;
  return (
    <g>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = top + ((bottom - top) * i) / ticks;
        const v = maxY - ((maxY - minY) * i) / ticks;
        return (
          <g key={i}>
            <line x1={left} x2={right} y1={y} y2={y} stroke="var(--color-grid)" strokeDasharray="3 4" />
            <text x={left - 10} y={y + 4} textAnchor="end" fontSize={11} fontFamily="var(--font-mono)" fill="var(--color-ink-soft)">
              {Number(v.toPrecision(3))}
            </text>
          </g>
        );
      })}
      <line x1={left} x2={right} y1={zeroY} y2={zeroY} stroke="var(--color-ink)" strokeWidth={1.5} />
      <line x1={left} x2={left} y1={top} y2={bottom} stroke="var(--color-ink)" strokeWidth={1.5} />
      <text x={(left + right) / 2} y={bottom + 36} textAnchor="middle" fontSize={13} fontFamily="var(--font-mono)" fill="var(--color-ink-soft)">
        {chart.xLabel}
      </text>
      <text
        x={left - 60}
        y={(top + bottom) / 2}
        textAnchor="middle"
        fontSize={13}
        fontFamily="var(--font-mono)"
        fill="var(--color-ink-soft)"
        transform={`rotate(-90 ${left - 60} ${(top + bottom) / 2})`}
      >
        {chart.yLabel}
      </text>
      {chart.series.map((s, idx) => {
        const st = stateOf(s.id, activeIds.has(s.id));
        if (st === "hidden") return null;
        const active = st === "active";
        const d = s.points
          .slice()
          .sort((a, b) => a.x - b.x)
          .map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x)} ${sy(p.y)}`)
          .join(" ");
        const color = `var(--node-${s.color})`;
        const last = s.points[s.points.length - 1] ?? { x: 0, y: 0 };
        return (
          <g key={s.id} style={{ opacity: active ? 1 : 0.4, transition: "opacity 0.5s" }}>
            <path
              d={d}
              pathLength={1}
              fill="none"
              stroke={color}
              strokeWidth={active ? 4 : 2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={firstAppearanceOf(lesson, s.id) === step ? "edge-draw" : undefined}
            />
            <text
              x={Math.min(sx(last.x) + 8, right - 4)}
              y={sy(last.y) - 8 - idx * 2}
              fontSize={12}
              fontFamily="var(--font-mono)"
              fill={color}
              fontWeight={600}
            >
              {s.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function firstAppearanceOf(lesson: Lesson, id: string) {
  return lesson.steps.findIndex((s) => s.highlightNodes.includes(id));
}
