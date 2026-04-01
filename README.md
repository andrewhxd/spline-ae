# Spline

Generate After Effects animations from JSON. Describe what you want in plain English, get a JSON plan, and Spline turns it into ExtendScript that runs directly in AE.

Spline is built to work with Claude Code. You describe an animation in natural language, Claude writes the JSON plan, and Spline generates the script. One command to apply. One Cmd+Z to undo.

## Requirements

- macOS (uses `osascript` to talk to After Effects)
- Adobe After Effects (must be running with a comp open)
- Node.js 18+

## Setup

```bash
npm install
```

## Usage

```bash
# Run animation directly in After Effects
npm run apply examples/pop-all-layers.json

# Preview the generated ExtendScript
npm run apply examples/pop-all-layers.json -- --dry-run

# Save script to a file
npm run apply examples/pop-all-layers.json -- --output out.jsx
```

## Working with Claude Code

1. Open your After Effects project and select a comp
2. Tell Claude what you want: "Make all layers pop in one by one"
3. Claude writes a JSON animation plan
4. Run `npm run apply plan.json` to execute it
5. Cmd+Z in AE to undo if it's not right
6. Iterate until it looks good

Claude can target existing layers, create new text and shapes, combine animations, and use presets. The JSON format is simple enough that Claude gets it right most of the time.

## Animation Plan Format

Every plan is a JSON file with `version`, `name`, and either `animations` (for existing layers) or `actions` (for creating new layers and mixed workflows). You can use both in the same plan.

```json
{
  "version": "1.0",
  "name": "My Animation"
}
```

### Targeting existing layers

Use the `animations` array to animate layers that already exist in your comp.

**All layers with a preset:**

```json
{
  "version": "1.0",
  "name": "Pop Everything",
  "animations": [
    {
      "preset": "pop",
      "target": { "mode": "all" },
      "stagger": { "delay": 0.08, "order": "index" }
    }
  ]
}
```

**Layers matching a pattern:**

```json
{
  "animations": [
    {
      "preset": "slide-up",
      "target": { "mode": "pattern", "pattern": "^Card" },
      "duration": 0.8,
      "easing": "easeOutCubic",
      "stagger": { "delay": 0.12, "order": "left-to-right" }
    }
  ]
}
```

**Selected layers with custom properties and effects:**

```json
{
  "animations": [
    {
      "target": { "mode": "selected" },
      "properties": [
        { "property": "opacity", "from": 0, "to": 100 },
        { "property": "scale", "from": 80, "to": 100 }
      ],
      "easing": "easeOutExpo",
      "duration": 0.5,
      "effects": [
        {
          "type": "glow",
          "params": { "threshold": 60, "radius": 25, "intensity": 2 }
        }
      ]
    }
  ]
}
```

### Creating new layers

Use the `actions` array with `type: "create_text"` or `type: "create_shape"` to add new layers.

**Create a text layer with fade in:**

```json
{
  "version": "1.0",
  "name": "Create Text",
  "actions": [
    {
      "type": "create_text",
      "name": "Headline",
      "text": "Hello World",
      "position": [960, 200],
      "style": {
        "fontSize": 64,
        "fontFamily": "Helvetica",
        "fillColor": [1, 1, 1],
        "justification": "center"
      },
      "animate": {
        "preset": "fade-in",
        "duration": 0.8,
        "easing": "easeOutCubic"
      }
    }
  ]
}
```

**Create a line with trim path wipe:**

```json
{
  "version": "1.0",
  "name": "Glowing Line",
  "actions": [
    {
      "type": "create_shape",
      "name": "Line",
      "shape": "line",
      "from": [200, 500],
      "to": [800, 500],
      "strokeWidth": 4,
      "strokeColor": [0, 0.8, 1],
      "effects": ["glow"],
      "animate": {
        "property": "trimPath",
        "from": 0,
        "to": 100,
        "duration": 1.2,
        "easing": "easeOutCubic"
      }
    }
  ]
}
```

### Special animations

**Typewriter effect** reveals text one character at a time using AE's Text Animator system:

```json
{
  "type": "create_text",
  "name": "Brand",
  "text": "shipped.one",
  "position": [960, 660],
  "style": {
    "fontSize": 42,
    "fillColor": [1, 1, 1],
    "justification": "center"
  },
  "animate": {
    "property": "typewriter",
    "duration": 0.8,
    "easing": "linear",
    "startAt": 1.4
  }
}
```

**Trim path** animates a shape being drawn on screen. Works with `create_shape` actions:

```json
{
  "animate": {
    "property": "trimPath",
    "from": 0,
    "to": 100,
    "duration": 1.2,
    "easing": "easeOutCubic"
  }
}
```

### Combining animations

You can combine typewriter with other properties like opacity. This creates a typewriter that also fades in:

```json
{
  "animate": {
    "property": "typewriter",
    "duration": 0.8,
    "easing": "linear",
    "startAt": 1.4,
    "properties": [
      { "property": "opacity", "from": 0, "to": 100 }
    ]
  }
}
```

You can also mix `animations` and `actions` in the same plan. This creates new layers and animates existing ones together:

```json
{
  "version": "1.0",
  "name": "Mixed",
  "actions": [
    {
      "type": "create_text",
      "name": "Title",
      "text": "Welcome",
      "position": [960, 150],
      "style": { "fontSize": 72, "fillColor": [1, 1, 1], "justification": "center" },
      "animate": { "preset": "fade-in", "duration": 0.6 }
    },
    {
      "type": "create_shape",
      "name": "Underline",
      "shape": "line",
      "from": [400, 220],
      "to": [1520, 220],
      "strokeWidth": 2,
      "strokeColor": [1, 0.8, 0],
      "animate": {
        "property": "trimPath",
        "from": 0,
        "to": 100,
        "duration": 0.8,
        "delay": 0.3,
        "easing": "easeOutCubic"
      }
    }
  ],
  "animations": [
    {
      "preset": "pop",
      "target": { "mode": "pattern", "pattern": "^Card" },
      "stagger": { "delay": 0.1, "order": "index" }
    }
  ]
}
```

### Relative positioning

Use `relative: true` on position properties to offset from the layer's current position instead of setting an absolute value:

```json
{
  "properties": [
    { "property": "position", "from": [0, 30], "to": [0, 0], "relative": true }
  ]
}
```

### Timing control

- `duration`: how long the animation takes (seconds)
- `delay`: wait before starting (seconds, relative to comp start)
- `startAt`: start at an exact time in the comp (seconds, absolute)

## Quick Reference

### Properties

| Property | Values | Notes |
|----------|--------|-------|
| `scale` | number (percent) | 100 = full size |
| `opacity` | number (percent) | 0 = invisible, 100 = fully visible |
| `rotation` | number (degrees) | |
| `position` | `[x, y]` | Use `relative: true` for offsets |

### Presets

| Preset | What it does |
|--------|-------------|
| `pop` | Scale 0 to 100 + fade in with overshoot |
| `fade-in` | Opacity 0 to 100 |
| `fade-out` | Opacity 100 to 0 |
| `slide-up` | Move up 50px + fade in |
| `bounce` | Scale 0 to 100 + fade in with overshoot |

### Easing

`linear`, `easeOutCubic`, `easeOutExpo`, `easeInOutQuad`, `easeOutBack`

### Stagger

Staggers add a delay between each layer's animation start.

| Order | Behavior |
|-------|----------|
| `index` | Layer stack order (top to bottom) |
| `reverse` | Bottom to top |
| `center` | Middle layers first, edges last |
| `random` | Random order (use `seed` for consistency) |
| `left-to-right` | Sorted by X position at runtime |

### Effects

| Effect | Params |
|--------|--------|
| `glow` | `threshold`, `radius`, `intensity` |
| `blur` | `blurriness` |
| `drop-shadow` | `opacity`, `direction`, `distance`, `softness` |

### Text style

```json
{
  "fontSize": 64,
  "fontFamily": "Helvetica",
  "fillColor": [1, 1, 1],
  "justification": "center",
  "opacity": 100
}
```

Colors are RGB arrays with values from 0 to 1. Justification can be `"left"`, `"center"`, or `"right"`.

### Target modes

| Mode | Requires | Selects |
|------|----------|---------|
| `"all"` | | Every layer in the comp |
| `"selected"` | | Currently selected layers in AE |
| `"pattern"` | `pattern` field | Layers whose name matches the regex |

You can add `limit` to cap the number of matched layers.

## Examples

The `examples/` folder has ready-to-use plans:

| File | What it does |
|------|-------------|
| `pop-all-layers.json` | Pop in every layer with index stagger |
| `fade-slide-stagger.json` | Slide up "Card" layers from left to right |
| `selected-glow.json` | Fade in selected layers with a glow effect |
| `create-text-with-fade.json` | Create a "Hello World" text layer and fade it in |
| `create-glowing-line.json` | Create a cyan line with glow and trim path wipe |
| `mixed-actions.json` | Title + underline + pop existing Card layers |
| `logo-accordion-spin.json` | Logo intro with spin, slide, and typewriter brand reveal |
| `logo-accordion-intro.json` | Logo layers scale in from center with typewriter text |

Run any example:

```bash
npm run apply examples/pop-all-layers.json
```

## Project Structure

```
src/
  cli.ts                  # CLI entry point (parse args, validate, generate, run)
  schema/
    types.ts              # TypeScript types for animation plans
    validation.ts         # Zod validation of JSON input
  generator/
    index.ts              # Main generator (orchestrates all modules)
    targeting.ts          # Layer selection (all, selected, pattern)
    stagger.ts            # Stagger delay calculation
    keyframes.ts          # Property keyframe generation
    easing.ts             # Easing curve application
    effects.ts            # AE effects (glow, blur, drop-shadow)
    create-text.ts        # Text layer creation
    create-shape.ts       # Shape layer creation
    inline-animation.ts   # Bridge for action-level animations
    trim-path.ts          # Trim path animation
    typewriter.ts         # Typewriter text animation
    utils.ts              # Shared helpers
    clamp.ts              # Value clamping
  runner/
    index.ts              # Execute ExtendScript in AE via osascript
  presets/
    index.ts              # Preset definitions (pop, fade-in, etc.)
examples/                 # Example animation plans
tests/                    # Test suite
```

## Running Tests

```bash
npm test
```

Tests cover validation, code generation, ES3 compliance, and backwards compatibility. There are 58 tests across 5 files.

## Limitations

- macOS only (uses `osascript` to talk to After Effects)
- After Effects must be running with a composition open
- Generated code is ES3 ExtendScript (no modern JS)
- Shape type is currently limited to `line`
- Spatial stagger sorting (`left-to-right`) runs at AE runtime
- AE version is auto-detected, falls back to "Adobe After Effects 2024"
