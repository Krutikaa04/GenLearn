import type { Transition, Variants } from 'framer-motion';

/** Default spring used across interactive elements — keeps physics consistent app-wide. */
export const springSnappy: Transition = { type: 'spring', stiffness: 420, damping: 32, mass: 0.9 };
export const springSoft: Transition = { type: 'spring', stiffness: 260, damping: 26, mass: 1 };

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: springSoft },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: springSnappy },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.12 } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.03 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: springSoft },
};

/** Press/hover physics for clickable elements (buttons, cards, nav items). */
export const pressable = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.96 },
  transition: springSnappy,
};

/** Slightly gentler variant for larger surfaces like cards, where a 1.02 scale looks jumpy. */
export const liftable = {
  whileHover: { y: -2 },
  transition: springSoft,
};
