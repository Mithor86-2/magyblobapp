/**
 * Stub de `lucide-react-native` para los tests (Vitest + jsdom).
 *
 * El paquete ESM de lucide no resuelve bajo el runner (`context.mjs` /
 * `LucideProvider`), por eso históricamente cada test mockeaba el wrapper `./Icon`.
 * Como `Icon` lo usan ya muchos componentes (incluido `SelectableChip`, US-89), se
 * aliasa la librería a este stub en `vitest.config.ts`: cada icono es un componente
 * inerte, de modo que `Icon` **sí** puede renderizar bajo Vitest sin mockearlo en cada
 * fichero. Debe exportar los nombres que importa `components/Icon.tsx`.
 */
import type { ComponentType } from 'react';

type IconStub = ComponentType<Record<string, unknown>>;
const Dummy: IconStub = () => null;

export type LucideIcon = IconStub;

export const ArrowRight = Dummy;
export const BadgeCheck = Dummy;
export const BookOpen = Dummy;
export const Check = Dummy;
export const Cloud = Dummy;
export const Compass = Dummy;
export const GraduationCap = Dummy;
export const Handshake = Dummy;
export const Home = Dummy;
export const Laugh = Dummy;
export const Library = Dummy;
export const MonitorSmartphone = Dummy;
export const Mountain = Dummy;
export const Music = Dummy;
export const Palette = Dummy;
export const Pause = Dummy;
export const PawPrint = Dummy;
export const Play = Dummy;
export const Puzzle = Dummy;
export const Rocket = Dummy;
export const Search = Dummy;
export const Shield = Dummy;
export const Smile = Dummy;
export const Sparkles = Dummy;
export const Square = Dummy;
export const Star = Dummy;
export const Tag = Dummy;
export const UserRound = Dummy;
export const Wand2 = Dummy;
export const X = Dummy;
