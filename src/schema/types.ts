// Spline Animation Plan Schema — TypeScript Interfaces

export type TargetMode = "all" | "selected" | "pattern";

export type ShapeType = "line";

export type EasingType =
  | "linear"
  | "easeOutCubic"
  | "easeOutExpo"
  | "easeInOutQuad"
  | "easeOutBack";

export type StaggerOrder =
  | "index"
  | "reverse"
  | "center"
  | "random"
  | "left-to-right";

export type PropertyName = "scale" | "position" | "opacity" | "rotation";

export type EffectType = "glow" | "blur" | "drop-shadow";

export type PresetName = "pop" | "fade-in" | "fade-out" | "slide-up" | "bounce";

export interface Target {
  mode: TargetMode;
  pattern?: string;
  limit?: number;
}

export interface Keyframe {
  time: number; // seconds relative to animation start
  value: number | [number, number] | [number, number, number];
}

export interface PropertyAnimation {
  property: PropertyName;
  from?: number | [number, number] | [number, number, number];
  to?: number | [number, number] | [number, number, number];
  keyframes?: Keyframe[];
  relative?: boolean;
}

export interface Stagger {
  delay: number; // seconds between each layer
  order: StaggerOrder;
  seed?: number; // for deterministic random order
}

export interface EffectParams {
  [key: string]: number;
}

export interface Effect {
  type: EffectType;
  params: EffectParams;
}

export interface Animation {
  preset?: PresetName;
  target: Target;
  properties?: PropertyAnimation[];
  easing?: EasingType;
  duration?: number; // seconds
  delay?: number; // seconds before animation starts
  startAt?: number; // absolute comp time in seconds
  stagger?: Stagger;
  effects?: Effect[];
  anchorPoint?: "center" | "bottom" | "top" | "left" | "right";
}

export interface TextStyle {
  fontSize?: number;
  fontFamily?: string;
  fillColor?: [number, number, number]; // RGB 0-1
  justification?: "left" | "center" | "right";
  opacity?: number;
}

export interface InlineAnimation {
  preset?: PresetName;
  properties?: PropertyAnimation[];
  easing?: EasingType;
  duration?: number;
  delay?: number;
  startAt?: number;
  effects?: Effect[];
  anchorPoint?: "center" | "bottom" | "top" | "left" | "right";
}

export interface TextAnimation extends InlineAnimation {
  property?: "typewriter";
  from?: number;
  to?: number;
}

export interface ShapeAnimation extends InlineAnimation {
  property?: PropertyName | "trimPath";
  from?: number | [number, number] | [number, number, number];
  to?: number | [number, number] | [number, number, number];
}

export interface CreateTextAction {
  type: "create_text";
  name: string;
  text: string;
  position?: [number, number];
  style?: TextStyle;
  animate?: TextAnimation;
}

export interface CreateShapeAction {
  type: "create_shape";
  name: string;
  shape: ShapeType;
  from?: [number, number];
  to?: [number, number];
  strokeWidth?: number;
  strokeColor?: [number, number, number];
  fillColor?: [number, number, number];
  effects?: EffectType[];
  animate?: ShapeAnimation;
}

export type Action = Animation | CreateTextAction | CreateShapeAction;

export interface AnimationPlan {
  version: "1.0";
  name: string;
  animations?: Animation[];
  actions?: Action[];
}
