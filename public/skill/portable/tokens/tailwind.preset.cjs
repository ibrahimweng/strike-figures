// Strike preset for Tailwind CSS v3. Generated from source/tokens.json; don't edit.
// tailwind.config.js: module.exports = { presets: [require('./tailwind.preset.cjs')], content: [...] }
// Load tokens.css too, so data-theme="light" switches ground, surfaces, ink and lines.
// It replaces Tailwind's colours, fonts, sizes, radii and spacing, so off-brand classes don't exist.
// Spacing keeps Tailwind's numbers (p-4 is 16px) but only the steps on the Strike scale.
module.exports = {
  "theme": {
    "colors": {
      "transparent": "transparent",
      "current": "currentColor",
      "inherit": "inherit",
      "ground": "rgb(var(--strike-ground-rgb, 12 12 12) / <alpha-value>)",
      "web-ground": "#090B0A",
      "web-section": "#0F1110",
      "ink": "rgb(var(--strike-ink-rgb, 249 249 249) / <alpha-value>)",
      "ink-2": "rgb(var(--strike-ink-2-rgb, 179 179 179) / <alpha-value>)",
      "ink-3": "rgb(var(--strike-ink-3-rgb, 138 143 152) / <alpha-value>)",
      "green": "#10B981",
      "deep": "#047857",
      "mark-light": "#6EE7B7",
      "profit": "#3FD4AB",
      "loss": "#EE5E74",
      "mint": "#50EBA0",
      "data-yellow": "#FFEF3C",
      "data-sky": "#0788F7",
      "data-purple": "#976FE6",
      "frame": "#2E2E2E",
      "surface-1": "rgb(var(--strike-surface-1-rgb, 22 22 22) / <alpha-value>)",
      "surface-2": "rgb(var(--strike-surface-2-rgb, 32 32 32) / <alpha-value>)",
      "surface-3": "rgb(var(--strike-surface-3-rgb, 42 42 42) / <alpha-value>)",
      "line": "var(--strike-line, #FFFFFF1A)",
      "line-strong": "var(--strike-line-strong, #FFFFFF2E)"
    },
    "fontFamily": {
      "sans": [
        "Geist",
        "Arial",
        "sans-serif"
      ],
      "mono": [
        "Geist Mono",
        "ui-monospace",
        "monospace"
      ],
      "pixel": [
        "Geist Pixel Circle",
        "Geist",
        "sans-serif"
      ]
    },
    "fontSize": {
      "display": [
        "72px",
        {
          "lineHeight": "0.95",
          "letterSpacing": "-0.03em",
          "fontWeight": "500"
        }
      ],
      "h1": [
        "48px",
        {
          "lineHeight": "1",
          "letterSpacing": "-0.03em",
          "fontWeight": "500"
        }
      ],
      "h2": [
        "32px",
        {
          "lineHeight": "1.1",
          "letterSpacing": "-0.02em",
          "fontWeight": "500"
        }
      ],
      "h3": [
        "24px",
        {
          "lineHeight": "1.2",
          "letterSpacing": "-0.015em",
          "fontWeight": "500"
        }
      ],
      "body-l": [
        "18px",
        {
          "lineHeight": "1.5",
          "letterSpacing": "0",
          "fontWeight": "400"
        }
      ],
      "body": [
        "16px",
        {
          "lineHeight": "1.5",
          "letterSpacing": "0",
          "fontWeight": "400"
        }
      ],
      "small": [
        "14px",
        {
          "lineHeight": "1.45",
          "letterSpacing": "0",
          "fontWeight": "400"
        }
      ],
      "label": [
        "12px",
        {
          "lineHeight": "1.4",
          "letterSpacing": "0.02em",
          "fontWeight": "500"
        }
      ]
    },
    "borderRadius": {
      "none": "0",
      "sm": "6px",
      "md": "8px",
      "lg": "12px",
      "pill": "9999px",
      "DEFAULT": "8px",
      "full": "9999px"
    },
    "spacing": {
      "0": "0",
      "1": "4px",
      "2": "8px",
      "3": "12px",
      "4": "16px",
      "6": "24px",
      "8": "32px",
      "12": "48px",
      "16": "64px",
      "24": "96px",
      "32": "128px",
      "px": "1px",
      "grid": "50px",
      "control": "40px",
      "control-sm": "32px"
    },
    "extend": {
      "transitionDuration": {
        "fast": "120ms",
        "base": "200ms",
        "slow": "320ms"
      },
      "transitionTimingFunction": {
        "strike": "cubic-bezier(0.2, 0, 0, 1)"
      }
    }
  }
};
