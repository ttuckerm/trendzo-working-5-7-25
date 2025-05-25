import { ElementType } from "../types";

// Interface for element item
export interface ElementItem {
  id: string;
  name: string;
  type: string;
  icon: string;
  description?: string;
  premium?: boolean;
  new?: boolean;
  tags?: string[];
}

// Interface for element category
export interface ElementCategory {
  id: string;
  name: string;
  icon?: string;
  elements: ElementItem[];
}

// Define all available elements organized by category
export const elementCategories: ElementCategory[] = [
  {
    id: "text",
    name: "Text",
    icon: "Type",
    elements: [
      {
        id: "text-heading",
        name: "Heading",
        type: "text",
        icon: "Heading",
        description: "Large, bold text for titles",
        tags: ["title", "header", "large"]
      },
      {
        id: "text-subheading",
        name: "Subheading",
        type: "text",
        icon: "Heading3",
        description: "Medium-sized text for subtitles",
        tags: ["subtitle", "medium"]
      },
      {
        id: "text-paragraph",
        name: "Paragraph",
        type: "text",
        icon: "Text",
        description: "Standard text for content",
        tags: ["body", "content", "paragraph"]
      },
      {
        id: "text-caption",
        name: "Caption",
        type: "text",
        icon: "AlignLeft",
        description: "Small text for captions",
        tags: ["small", "caption", "description"]
      },
      {
        id: "text-quote",
        name: "Quote",
        type: "text",
        icon: "Quote",
        description: "Formatted blockquote",
        tags: ["quote", "citation"]
      },
      {
        id: "text-list",
        name: "List",
        type: "text",
        icon: "List",
        description: "A bulleted or numbered list",
        tags: ["list", "bulleted", "numbered"]
      },
      {
        id: "text-callout",
        name: "Callout",
        type: "text",
        icon: "MessageSquare",
        description: "A highlighted message or note",
        premium: true,
        tags: ["highlight", "note"]
      }
    ]
  },
  {
    id: "media",
    name: "Media",
    icon: "Image",
    elements: [
      {
        id: "media-image",
        name: "Image",
        type: "image",
        icon: "Image",
        description: "Upload or insert an image",
        tags: ["photo", "picture", "image"]
      },
      {
        id: "media-video",
        name: "Video",
        type: "video",
        icon: "Video",
        description: "Upload or embed a video",
        tags: ["video", "clip", "footage"]
      },
      {
        id: "media-audio",
        name: "Audio",
        type: "audio",
        icon: "Music",
        description: "Add background music or sounds",
        tags: ["sound", "music", "audio"]
      },
      {
        id: "media-embed",
        name: "Embed",
        type: "embed",
        icon: "Code",
        description: "Embed content from external sources",
        premium: true,
        tags: ["external", "source", "embed"]
      },
      {
        id: "media-gif",
        name: "GIF",
        type: "gif",
        icon: "Film",
        description: "Add an animated GIF",
        premium: true,
        tags: ["animation", "gif", "moving"]
      },
      {
        id: "media-carousel",
        name: "Carousel",
        type: "image",
        icon: "Images",
        description: "Multiple images in a slideshow",
        premium: true,
        tags: ["slideshow", "multiple", "gallery"]
      }
    ]
  },
  {
    id: "shapes",
    name: "Shapes",
    icon: "Square",
    elements: [
      {
        id: "shape-rectangle",
        name: "Rectangle",
        type: "shape",
        icon: "Square",
        description: "A simple rectangle or square",
        tags: ["rectangle", "square", "box"]
      },
      {
        id: "shape-circle",
        name: "Circle",
        type: "shape",
        icon: "Circle",
        description: "A perfect circle or oval",
        tags: ["circle", "oval", "round"]
      },
      {
        id: "shape-triangle",
        name: "Triangle",
        type: "shape",
        icon: "Triangle",
        description: "A three-sided shape",
        tags: ["triangle", "pyramid"]
      },
      {
        id: "shape-line",
        name: "Line",
        type: "shape",
        icon: "Minus",
        description: "A straight or curved line",
        tags: ["line", "divider", "separator"]
      },
      {
        id: "shape-custom",
        name: "Custom Shape",
        type: "shape",
        icon: "Pencil",
        description: "Draw your own shape",
        premium: true,
        tags: ["custom", "draw", "path"]
      }
    ]
  },
  {
    id: "stickers",
    name: "Stickers",
    icon: "Sticker",
    elements: [
      {
        id: "sticker-emoji",
        name: "Emoji",
        type: "sticker",
        icon: "Smile",
        description: "Add expressive emoji",
        tags: ["emoji", "face", "expression"]
      },
      {
        id: "sticker-arrow",
        name: "Arrow",
        type: "sticker",
        icon: "ArrowRight",
        description: "Directional arrows",
        tags: ["arrow", "direction", "pointer"]
      },
      {
        id: "sticker-star",
        name: "Star",
        type: "sticker",
        icon: "Star",
        description: "Star shapes for emphasis",
        tags: ["star", "highlight", "favorite"]
      },
      {
        id: "sticker-badge",
        name: "Badge",
        type: "sticker",
        icon: "Badge",
        description: "Decorative badges",
        tags: ["badge", "award", "medal"]
      },
      {
        id: "sticker-trending",
        name: "Trending",
        type: "sticker",
        icon: "TrendingUp",
        description: "Trending icons and indicators",
        new: true,
        tags: ["trending", "viral", "popular"]
      },
      {
        id: "sticker-shape",
        name: "Shape",
        type: "shape",
        icon: "Square",
        description: "A simple shape",
        tags: ["shape", "square"]
      },
      {
        id: "sticker-animated",
        name: "Animated",
        type: "animated",
        icon: "Zap",
        description: "An animated sticker",
        premium: true,
        tags: ["animation", "moving"]
      }
    ]
  },
  {
    id: "effects",
    name: "Effects",
    icon: "Zap",
    elements: [
      {
        id: "effect-overlay",
        name: "Color Overlay",
        type: "effect",
        icon: "Palette",
        description: "Add a color filter",
        tags: ["filter", "overlay", "color"]
      },
      {
        id: "effect-blur",
        name: "Blur",
        type: "effect",
        icon: "Eye",
        description: "Add a blur effect",
        tags: ["blur", "soft", "unfocus"]
      },
      {
        id: "effect-shadow",
        name: "Shadow",
        type: "effect",
        icon: "Cloud",
        description: "Add shadows to elements",
        tags: ["shadow", "depth", "dimension"]
      },
      {
        id: "effect-glow",
        name: "Glow",
        type: "effect",
        icon: "Sun",
        description: "Add a glowing highlight",
        premium: true,
        tags: ["glow", "highlight", "shine"]
      },
      {
        id: "effect-noise",
        name: "Noise",
        type: "effect",
        icon: "Activity",
        description: "Add texture with grain effect",
        premium: true,
        tags: ["noise", "grain", "texture"]
      }
    ]
  }
]; 