# Project Mission

Build portfolio-quality, premium frontend experiences for real-feeling consumer products. For this repository, the canonical experience is a one-page launch website for `Velocity One ANC`, built around the local video asset `Headphones Kling.mp4`.

# Required Skills

For any task involving layout, typography, spacing, component polish, visual hierarchy, animation style, or general frontend UI/UX quality, use the `frontend-design` skill.

For any task involving `Headphones Kling.mp4`, scroll-linked playback, hero choreography, media-driven layout, or turning a video asset into a web experience, use the `video-to-website` skill.

# Canonical Product Definition

Brand: Velocity  
Product: Velocity One ANC  
Category: Premium wireless over-ear headphones  
Price: $399  
Primary colorway: Obsidian Black

Positioning:
Velocity One ANC is a premium headphone product positioned around refined industrial design, studio-grade sound, adaptive noise cancellation, comfort, battery life, and everyday portability.

Tone:
Calm, precise, premium, engineering-forward, restrained, confident.

Keywords:
Cinematic, technical, quiet luxury, matte black, industrial elegance, precision, premium consumer electronics.

# Experience Goals

The website must feel like a real premium product launch page, not a generic startup landing page and not a student demo.

The entire page should visually blend with the black background of the hero video so the experience feels continuous.

The hero must use `Headphones Kling.mp4` as the centerpiece and should create the impression that the product is gradually zooming out / revealing more of itself as the user scrolls.

Motion must be smooth, subtle, and expensive-looking. Never gimmicky.

Desktop quality is the top priority, but tablet and mobile must also be polished and intentional.

# Required Information Architecture

The one-page site should include:
- Sticky header / nav
- Fullscreen video hero
- Product overview
- Sound quality section
- ANC / transparency section
- Comfort / materials / fit section
- Battery / charging / connectivity / controls section
- Technical design / engineering section
- Specs section
- Reviews / social proof
- FAQ
- Final CTA / purchase section
- Footer with support and legal links

# Content Standards

No lorem ipsum.
No placeholder copy.
No vague startup clichés.
All copy should feel believable, premium, and product-specific.

Use realistic and internally consistent product claims and specifications. The product should feel completely real.

Suggested feature space includes:
- Custom 40 mm drivers
- Adaptive ANC
- Transparency mode
- Multipoint Bluetooth
- USB-C fast charging
- 40-hour battery with ANC
- Wear detection
- Low-latency mode
- Companion app EQ and controls
- 2-year warranty

Do not make obviously unrealistic claims.

# Frontend Standards

Prefer:
- React
- TypeScript
- Vite
- Tailwind CSS

For pinned hero behavior and scroll-linked motion, prefer GSAP ScrollTrigger or an equally robust alternative.

Use semantic HTML and accessible patterns.
Respect `prefers-reduced-motion`.
Design for strong performance.
Handle video loading intelligently.
Keep components reusable and code organized.
Avoid unnecessary dependencies.

# Visual Direction

The background should remain black or near-black across the entire experience.

Use matte black, graphite, charcoal, and restrained gray accents.
Typography should be crisp, high-contrast, and premium.
Layouts should feel spacious, aligned, and art-directed.
Micro-interactions should be subtle and refined.
Favor product-first compositions over generic marketing blocks.

Avoid:
- Bright accent colors
- Busy gradients
- Excessive glassmorphism
- Overly playful UI
- Template-looking sections
- Cluttered cards or weak hierarchy

# Hero Behavior

The hero should feel cinematic and controlled.

The video should be integrated into a pinned scroll experience where scrolling reveals more of the product and creates a premium zoom-out feeling.

The transition from the hero into the rest of the page must feel seamless.

Provide fallbacks for devices or browsers where scroll-scrub video is unreliable.

# Working Style

First inspect the repo and available assets.
Then state a short plan.
Then implement the full experience without repeated confirmation loops.
Make strong design decisions autonomously.
Validate responsiveness and polish before finishing.
End with concise run instructions and a brief summary of what changed.

# Quality Bar

Assume this project is being judged as a professional demo of product website design ability.

Every decision should optimize for realism, polish, cohesion, readability, motion quality, and premium presentation.