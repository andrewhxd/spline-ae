import { z } from "zod";
import type { AnimationPlan } from "./types.js";

const targetSchema = z
  .object({
    mode: z.enum(["all", "selected", "pattern"]),
    pattern: z.string().optional(),
    limit: z.number().int().positive().optional(),
  })
  .refine(
    (t) => t.mode !== "pattern" || (t.pattern !== undefined && t.pattern.length > 0),
    { message: "pattern is required when mode is 'pattern'" }
  );

const keyframeSchema = z.object({
  time: z.number().min(0),
  value: z.union([
    z.number(),
    z.tuple([z.number(), z.number()]),
    z.tuple([z.number(), z.number(), z.number()]),
  ]),
});

const propertyAnimationSchema = z.object({
  property: z.enum(["scale", "position", "opacity", "rotation"]),
  from: z
    .union([
      z.number(),
      z.tuple([z.number(), z.number()]),
      z.tuple([z.number(), z.number(), z.number()]),
    ])
    .optional(),
  to: z
    .union([
      z.number(),
      z.tuple([z.number(), z.number()]),
      z.tuple([z.number(), z.number(), z.number()]),
    ])
    .optional(),
  keyframes: z.array(keyframeSchema).optional(),
  relative: z.boolean().optional(),
});

const staggerSchema = z.object({
  delay: z.number().min(0),
  order: z.enum(["index", "reverse", "center", "random", "left-to-right"]),
  seed: z.number().int().optional(),
});

const effectSchema = z.object({
  type: z.enum(["glow", "blur", "drop-shadow"]),
  params: z.record(z.string(), z.number()),
});

const animationSchema = z.object({
  preset: z.enum(["pop", "fade-in", "fade-out", "slide-up", "bounce"]).optional(),
  target: targetSchema,
  properties: z.array(propertyAnimationSchema).optional(),
  easing: z
    .enum(["linear", "easeOutCubic", "easeOutExpo", "easeInOutQuad", "easeOutBack"])
    .optional(),
  duration: z.number().positive().optional(),
  delay: z.number().min(0).optional(),
  startAt: z.number().min(0).optional(),
  stagger: staggerSchema.optional(),
  effects: z.array(effectSchema).optional(),
  anchorPoint: z.enum(["center", "bottom", "top", "left", "right"]).optional(),
});

const textStyleSchema = z.object({
  fontSize: z.number().positive().optional(),
  fontFamily: z.string().optional(),
  fillColor: z.tuple([z.number(), z.number(), z.number()]).optional(),
  justification: z.enum(["left", "center", "right"]).optional(),
  opacity: z.number().min(0).max(100).optional(),
});

const easingEnum = z
  .enum(["linear", "easeOutCubic", "easeOutExpo", "easeInOutQuad", "easeOutBack"])
  .optional();

const inlineAnimationSchema = z.object({
  preset: z.enum(["pop", "fade-in", "fade-out", "slide-up", "bounce"]).optional(),
  properties: z.array(propertyAnimationSchema).optional(),
  easing: easingEnum,
  duration: z.number().positive().optional(),
  delay: z.number().min(0).optional(),
  startAt: z.number().min(0).optional(),
  effects: z.array(effectSchema).optional(),
  anchorPoint: z.enum(["center", "bottom", "top", "left", "right"]).optional(),
});

const shapeAnimateSchema = inlineAnimationSchema.extend({
  property: z
    .union([
      z.enum(["scale", "position", "opacity", "rotation"]),
      z.literal("trimPath"),
    ])
    .optional(),
  from: z
    .union([
      z.number(),
      z.tuple([z.number(), z.number()]),
      z.tuple([z.number(), z.number(), z.number()]),
    ])
    .optional(),
  to: z
    .union([
      z.number(),
      z.tuple([z.number(), z.number()]),
      z.tuple([z.number(), z.number(), z.number()]),
    ])
    .optional(),
});

const textAnimateSchema = inlineAnimationSchema.extend({
  property: z.literal("typewriter").optional(),
  from: z.number().min(0).max(100).optional(),
  to: z.number().min(0).max(100).optional(),
});

const createTextSchema = z.object({
  type: z.literal("create_text"),
  name: z.string().min(1),
  text: z.string().min(1),
  position: z.tuple([z.number(), z.number()]).optional(),
  style: textStyleSchema.optional(),
  animate: textAnimateSchema.optional(),
});

const createShapeSchema = z
  .object({
    type: z.literal("create_shape"),
    name: z.string().min(1),
    shape: z.enum(["line"]),
    from: z.tuple([z.number(), z.number()]).optional(),
    to: z.tuple([z.number(), z.number()]).optional(),
    strokeWidth: z.number().positive().optional(),
    strokeColor: z.tuple([z.number(), z.number(), z.number()]).optional(),
    fillColor: z.tuple([z.number(), z.number(), z.number()]).optional(),
    effects: z.array(z.enum(["glow", "blur", "drop-shadow"])).optional(),
    animate: shapeAnimateSchema.optional(),
  })
  .refine(
    (s) => s.shape !== "line" || (s.from !== undefined && s.to !== undefined),
    { message: "line shape requires 'from' and 'to' endpoints" }
  );

const actionSchema = z.union([createTextSchema, createShapeSchema, animationSchema]);

const animationPlanSchema = z.object({
  version: z.literal("1.0"),
  name: z.string().min(1),
  animations: z.array(animationSchema).optional(),
  actions: z.array(actionSchema).optional(),
});

const planSchema = animationPlanSchema.refine(
  (p) => {
    const hasAnimations = p.animations !== undefined && p.animations.length > 0;
    const hasActions = p.actions !== undefined && p.actions.length > 0;
    return hasAnimations || hasActions;
  },
  { message: "Plan must have at least one animation or action" }
);

export interface ValidationResult {
  success: boolean;
  plan?: AnimationPlan;
  errors?: string[];
}

export function validatePlan(input: unknown): ValidationResult {
  const result = planSchema.safeParse(input);
  if (result.success) {
    return { success: true, plan: result.data as AnimationPlan };
  }
  return {
    success: false,
    errors: result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    ),
  };
}

export { animationPlanSchema, planSchema };
