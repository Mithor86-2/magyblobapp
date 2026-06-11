---
name: Aprendizaje Mágico
colors:
  surface: '#fff8f6'
  surface-dim: '#e8d7d0'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1eb'
  surface-container: '#fceae3'
  surface-container-high: '#f6e5de'
  surface-container-highest: '#f0dfd8'
  on-surface: '#221a16'
  on-surface-variant: '#554242'
  inverse-surface: '#382e2a'
  inverse-on-surface: '#ffede6'
  outline: '#887271'
  outline-variant: '#dbc0bf'
  surface-tint: '#9c4143'
  primary: '#9c4143'
  on-primary: '#ffffff'
  primary-container: '#ff8e8e'
  on-primary-container: '#772529'
  inverse-primary: '#ffb3b2'
  secondary: '#426561'
  on-secondary: '#ffffff'
  secondary-container: '#c2e7e2'
  on-secondary-container: '#476965'
  tertiary: '#0d6683'
  on-tertiary: '#ffffff'
  tertiary-container: '#72b8d8'
  on-tertiary-container: '#00485e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b2'
  on-primary-fixed: '#410008'
  on-primary-fixed-variant: '#7e2a2d'
  secondary-fixed: '#c5eae5'
  secondary-fixed-dim: '#a9cec9'
  on-secondary-fixed: '#00201e'
  on-secondary-fixed-variant: '#2b4d49'
  tertiary-fixed: '#bee9ff'
  tertiary-fixed-dim: '#8ad0f1'
  on-tertiary-fixed: '#001f2a'
  on-tertiary-fixed-variant: '#004d65'
  background: '#fff8f6'
  on-background: '#221a16'
  surface-variant: '#f0dfd8'
typography:
  display-lg:
    fontFamily: Quicksand
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
  headline-md:
    fontFamily: Quicksand
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  body-lg:
    fontFamily: Quicksand
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 30px
  body-md:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  label-bold:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 20px
  button-text:
    fontFamily: Quicksand
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  container-padding: 24px
  element-gap: 16px
---

## Brand & Style

The design system is built to evoke a sense of "Whimsical Professionalism." It bridges the gap between a high-end interactive children’s book and a reliable educational tool. The target audience includes toddlers (ages 2-5) and their parents, requiring a UI that is both playful and intuitive.

The style is a blend of **Minimalism** and **Tactile Playfulness**. By utilizing heavy whitespace alongside vibrant, squishy UI elements, the system remains uncluttered (KISS principle) while providing the tactile feedback children need to understand interactivity. The emotional response is one of safety, curiosity, and joy.

## Colors

The palette uses "Saturated Pastels" to maintain energy without overstimulating the young user.

- **Primary (Soft Coral):** Used for main actions and emotional highlights.
- **Secondary (Desaturated Mint):** A softer, more muted mint used for "Success" states and nature-themed educational modules to ensure better legibility and a calmer aesthetic.
- **Tertiary (Sky Blue):** Used for background elements and calm navigation.
- **Accent (Sunny Yellow):** Reserved for rewards, stars, and interactive "surprises."
- **Neutral (Cocoa):** A warm dark brown instead of black to keep the interface soft and readable for parents.
- **Surface:** A warm off-white (Cream) is used for the background to reduce eye strain compared to pure white.

## Typography

This design system uses **Quicksand** exclusively for its rounded terminals and open counters, which mirror the handwriting taught in early childhood.

- **Scale:** Font sizes are intentionally larger than standard apps to accommodate both emerging readers and parents glancing at the screen from a distance.
- **Hierarchy:** Headlines use a Bold (700) weight to stand out against vibrant backgrounds. Body text uses Medium (500) to ensure legibility without appearing too "heavy."
- **Readability:** Increased line heights and generous letter spacing are applied to all body text to prevent visual crowding for dyslexic-friendly accessibility.

## Layout & Spacing

The layout follows a **Fluid Grid** model with high internal margins to create "Safe Tap Zones." 

- **Tap Targets:** Every interactive element must be at least 64x64px to accommodate the developing motor skills of toddlers.
- **Safe Areas:** A minimum outer margin of 24px is maintained on all mobile screens to prevent accidental triggers near the bezel.
- **Rhythm:** Spacing follows an 8px base unit. Vertical rhythm is loose (24px to 40px gaps) to ensure the content feels airy and approachable.

## Elevation & Depth

This design system avoids harsh, realistic shadows in favor of **Soft Ambient Depth**.

- **Shadows:** Use a "Drop-Shadow" effect with 0px X-offset, a large Y-offset (8px+), and high blur (20px) at low opacity (10-15%). The shadow color should be a tinted version of the background (e.g., a soft blue shadow on a cream background) rather than grey.
- **Tonal Layers:** Deeply rounded cards sit on a slightly darker background shade to create a "stacked paper" effect.
- **Pressed States:** When a button is pressed, it should "sink" (reduce Y-offset and blur) to provide immediate tactile feedback.

## Shapes

The shape language is dominated by "Super-ellipses" and heavy rounding.

- **Components:** Standard buttons and inputs use a **Pill-shaped (3)** radius.
- **Containers:** Content cards and modals must use a minimum radius of **24px (rounded-xl)** to maintain the friendly, "no-sharp-edges" safety aesthetic.
- **Icons:** All iconography should feature rounded caps and joins with a consistent stroke weight of 2pt or higher.

## Components

### Bubbly Buttons
Primary buttons are large, colorful, and "squishy." They feature a thick bottom border (3-4px) in a darker shade of the button color to simulate a 3D physical button. 

### Activity Cards
Cards use a 24px corner radius and a subtle internal padding of 20px. They should always have a colored border (2px) that matches the category of the content (e.g., Mint for math, Blue for reading).

### Bottom Navigation
The navigation bar uses large, illustrative icons. Active states are indicated by a "blob" background behind the icon in a secondary pastel color, rather than just a color change, making the active tab obvious for non-readers.

### Input Fields
Forms (intended for parents) use the same rounded language but with a more conservative 16px radius and a soft Tertiary-color border.

### Progress Bubbles
Instead of a linear progress bar, use a series of "bubbles" or "stars" that fill up with the Accent Yellow color as the child completes tasks.