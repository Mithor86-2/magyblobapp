---
name: Aprendizaje Mágico (Nocturno)
colors:
  surface: '#111125'
  surface-dim: '#111125'
  surface-bright: '#37374d'
  surface-container-lowest: '#0c0c1f'
  surface-container-low: '#1a1a2e'
  surface-container: '#1e1e32'
  surface-container-high: '#28283d'
  surface-container-highest: '#333348'
  on-surface: '#e2e0fc'
  on-surface-variant: '#dec0bb'
  inverse-surface: '#e2e0fc'
  inverse-on-surface: '#2f2e43'
  outline: '#a58b86'
  outline-variant: '#57423e'
  surface-tint: '#ffb4a7'
  primary: '#ffb4a7'
  on-primary: '#640c04'
  primary-container: '#ff7f6a'
  on-primary-container: '#73180c'
  inverse-primary: '#a43b2c'
  secondary: '#d3bcfc'
  on-secondary: '#38265b'
  secondary-container: '#523f76'
  on-secondary-container: '#c4aeed'
  tertiary: '#76d5e1'
  on-tertiary: '#00363c'
  tertiary-container: '#52b2be'
  on-tertiary-container: '#004148'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a7'
  on-primary-fixed: '#400200'
  on-primary-fixed-variant: '#842417'
  secondary-fixed: '#ebdcff'
  secondary-fixed-dim: '#d3bcfc'
  on-secondary-fixed: '#230f45'
  on-secondary-fixed-variant: '#503d73'
  tertiary-fixed: '#93f1fd'
  tertiary-fixed-dim: '#76d5e1'
  on-tertiary-fixed: '#001f23'
  on-tertiary-fixed-variant: '#004f56'
  background: '#111125'
  on-background: '#e2e0fc'
  surface-variant: '#333348'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 30px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  touch-target: 56px
  gutter-md: 24px
  margin-edge: 32px
  card-padding: 24px
---

## Brand & Style

This design system translates the "Aprendizaje Mágico" experience into a soothing, low-light environment tailored for young children. The brand personality remains friendly, soft, and magical, but shifts from a daytime "playroom" feel to an "enchanted night sky" aesthetic. This helps toddlers (ages 3-4) transition into a calmer state of mind while maintaining engagement.

The design style is a blend of **Glassmorphism** and **Tactile/Skeuomorphic** elements. Surfaces utilize deep, translucent layers to mimic the depth of space, while interactive elements maintain a "squishy," physical feel that invites touch. The emotional response is one of safety, wonder, and gentle discovery—evoking the feeling of a digital Montessori environment under the stars.

## Colors

The color palette transitions from bright pastels to a deep, cosmic base. 

- **Primary (Coral):** Used for high-priority calls to action and "success" moments. It provides high contrast against the dark background to guide a toddler's eye.
- **Secondary (Soft Purple):** Used for secondary interactions and decorative magic elements.
- **Tertiary (Soft Aqua):** Reserved for hints, navigation trails, and "gentle" feedback.
- **Surfaces:** A hierarchy of deep Indigo (`#1A1A2E`) for the base layer, shifting to Charcoal (`#2D2D44`) for containers. 

Gradients should be used sparingly, primarily as background "auroras" behind content cards to provide depth without clutter.

## Typography

We use **Plus Jakarta Sans** across all levels for its soft, rounded terminals and exceptional legibility. For toddlers, we prioritize high x-height and generous letter spacing to ensure letters don't "blur" into the dark background.

- **Weighting:** Headlines are set to Extra Bold (800) to create a clear visual hierarchy. Body text stays at Medium (500) or Semi-Bold (600) to maintain "chunkiness" and readability.
- **Color Contrast:** All text must be off-white or very light pastel to avoid the harsh vibration of pure #FFFFFF on #000000. Use `Secondary/50` for labels to keep them distinct from primary content.

## Layout & Spacing

The layout philosophy centers on **Safe Zones and Large Targets**. Because toddlers use their whole hand or "fat-finger" interactions, spacing is much more generous than standard apps.

- **Fluid Grid:** Content fills the screen width with a minimum 32px side margin to prevent accidental triggers near device edges.
- **Gutter Rhythm:** A 24px gutter ensures elements are distinct. 
- **The "Thumb Zone":** Key navigation elements are placed in the bottom 40% of the screen.
- **Mobile vs Tablet:** On tablets, the layout expands to a 2-column or 3-column "Activity Grid," whereas mobile remains a single-column stack to maximize touch target size.

## Elevation & Depth

Depth is created through **Tonal Layers and Glassmorphism** rather than traditional drop shadows.

1.  **The Canvas (Level 0):** Deep Indigo base.
2.  **The Activity Layer (Level 1):** Charcoal containers with a slight 10% opacity white inner-glow to define the edges.
3.  **Floating Elements (Level 2):** Semi-transparent glass panels (Background Blur: 20px) with a subtle 1px border in a lighter purple to represent "Magical" overlays.
4.  **Buttons (Level 3):** These use an "Inner Shadow" technique to appear extruded and 3D, creating a tactile "press-me" affordance.

## Shapes

The design system utilizes **Pill-shaped (Round Full)** geometry for all interactive components. 

- Every corner is a full radius to eliminate "sharp" edges, reinforcing the safe, Montessori-inspired feel. 
- Content cards use the `rounded-xl` (3rem) setting to maintain a soft, friendly silhouette. 
- Icons are always enclosed in circular or squircle containers to prevent them from feeling too abstract or disconnected from the touch interface.

## Components

### Buttons
Primary buttons are large (min 56px height) and use the Coral color. They feature a 4px bottom "lip" of a darker coral shade to simulate a physical button that can be pushed down.

### Cards
Cards are the primary container for activities. In this dark mode, they use the Charcoal surface with a soft `Secondary` glow. Images within cards should have a 16px corner radius.

### Progress Stars (Chips)
Instead of standard chips, use "Star" icons. When an activity is completed, the star fills with the Tertiary Aqua color and emits a soft outer glow.

### Interactive Sliders
Used for volume or brightness. These should be thick (24px track height) with a large, circular "Moon" or "Sun" handle that is easy for a toddler to grab.

### Inputs
Avoid traditional text inputs. Use "Tap-to-Select" large cards or "Drag-to-Match" zones. If a name input is required, use a high-contrast field with a 32px font size.

### Feedback Overlays
When a toddler gets an answer right, use a full-screen "Magic Burst" with soft-edged particles in Coral and Aqua, layered over a blurred version of the current screen.