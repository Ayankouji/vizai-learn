import { z } from "zod";

export const VISUAL_TYPES = [
  "diagram",
  "flowchart",
  "process",
  "cycle",
  "timeline",
  "concept_map",
  "hierarchy",
  "comparison",
  "graph",
  "math",
  "code_flow",
  "scientific_illustration",
] as const;

export const EXPLANATION_STYLES = [
  "simple",
  "detailed",
  "real_world_examples",
  "exam_focused",
  "story_analogy",
] as const;

export const VisualizeRequestSchema = z.object({
  topic: z.string().trim().min(2).max(200),
  subject: z.string().trim().min(2).max(80),
  grade: z.string().trim().min(1).max(40),
  explanation: z.enum(EXPLANATION_STYLES),
});
export type VisualizeRequest = z.infer<typeof VisualizeRequestSchema>;

const NodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  sublabel: z.string().nullable().optional(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  shape: z.enum(["rect", "circle", "diamond", "pill", "cloud"]),
  color: z.number().int().min(1).max(5),
  icon: z.string().nullable().optional(),
});

const EdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  label: z.string().nullable().optional(),
  style: z.enum(["solid", "dashed"]),
  bidirectional: z.boolean().nullable().optional(),
});

const StepSchema = z.object({
  title: z.string(),
  explanation: z.string(),
  annotation: z.string(),
  highlightNodes: z.array(z.string()),
  highlightEdges: z.array(z.string()),
  formula: z.string().nullable().optional(),
});

const ChartSchema = z.object({
  xLabel: z.string(),
  yLabel: z.string(),
  series: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      color: z.number().int().min(1).max(5),
      points: z.array(z.object({ x: z.number(), y: z.number() })).min(2),
    }),
  ),
});

export const LessonSchema = z.object({
  title: z.string(),
  visualType: z.enum(VISUAL_TYPES),
  whyThisVisual: z.string(),
  summary: z.string(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  chart: ChartSchema.nullable().optional(),
  steps: z.array(StepSchema).min(1),
  keyTakeaways: z.array(z.string()),
  quiz: z
    .object({
      question: z.string(),
      options: z.array(z.string()).min(2).max(4),
      answerIndex: z.number().int(),
      explanation: z.string(),
    })
    .nullable()
    .optional(),
});

export type Lesson = z.infer<typeof LessonSchema>;
export type LessonNode = z.infer<typeof NodeSchema>;
export type LessonEdge = z.infer<typeof EdgeSchema>;
export type LessonStep = z.infer<typeof StepSchema>;
export type LessonChart = z.infer<typeof ChartSchema>;

/** JSON schema handed to the model for structured output. */
export const LESSON_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "visualType", "whyThisVisual", "summary", "nodes", "edges", "chart", "steps", "keyTakeaways", "quiz"],
  properties: {
    title: { type: "string" },
    visualType: { type: "string", enum: [...VISUAL_TYPES] },
    whyThisVisual: { type: "string" },
    summary: { type: "string" },
    nodes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "sublabel", "x", "y", "shape", "color", "icon"],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          sublabel: { type: ["string", "null"] },
          x: { type: "number" },
          y: { type: "number" },
          shape: { type: "string", enum: ["rect", "circle", "diamond", "pill", "cloud"] },
          color: { type: "integer" },
          icon: { type: ["string", "null"] },
        },
      },
    },
    edges: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "from", "to", "label", "style", "bidirectional"],
        properties: {
          id: { type: "string" },
          from: { type: "string" },
          to: { type: "string" },
          label: { type: ["string", "null"] },
          style: { type: "string", enum: ["solid", "dashed"] },
          bidirectional: { type: ["boolean", "null"] },
        },
      },
    },
    chart: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["xLabel", "yLabel", "series"],
      properties: {
        xLabel: { type: "string" },
        yLabel: { type: "string" },
        series: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "label", "color", "points"],
            properties: {
              id: { type: "string" },
              label: { type: "string" },
              color: { type: "integer" },
              points: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["x", "y"],
                  properties: { x: { type: "number" }, y: { type: "number" } },
                },
              },
            },
          },
        },
      },
    },
    steps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "explanation", "annotation", "highlightNodes", "highlightEdges", "formula"],
        properties: {
          title: { type: "string" },
          explanation: { type: "string" },
          annotation: { type: "string" },
          highlightNodes: { type: "array", items: { type: "string" } },
          highlightEdges: { type: "array", items: { type: "string" } },
          formula: { type: ["string", "null"] },
        },
      },
    },
    keyTakeaways: { type: "array", items: { type: "string" } },
    quiz: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["question", "options", "answerIndex", "explanation"],
      properties: {
        question: { type: "string" },
        options: { type: "array", items: { type: "string" } },
        answerIndex: { type: "integer" },
        explanation: { type: "string" },
      },
    },
  },
} as const;
