/**
 * Arconte Landing Page - Framer Motion Animation Variants
 *
 * Archivo de utilidades para animaciones consistentes en toda la landing.
 * Basado en tendencias de diseño 2025 y validado por análisis de competencia.
 *
 * @author Arconte Team
 * @date 2025-10-18
 */

// Fade in desde abajo (para secciones al scrollear)
export const fadeInUp = {
  hidden: {
    opacity: 0,
    y: 60
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

// Container con stagger (para grids de features)
export const staggerContainer = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

// Stagger item individual
export const staggerItem = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

// Scale en hover (para cards y botones)
export const scaleOnHover = {
  scale: 1.05,
  transition: {
    duration: 0.2,
    ease: "easeInOut"
  }
};

// Float animation (para LoginCard)
export const floatAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

// Counter animation (para números de social proof)
export const counterAnimation = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0
  },
  transition: {
    duration: 0.5
  }
};

// Fade in simple (para navbar)
export const fadeIn = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4
    }
  }
};

// Slide in desde arriba (para navbar)
export const slideDown = {
  hidden: {
    y: -100,
    opacity: 0
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

// Slide in desde derecha (para LoginCard)
export const slideInRight = {
  hidden: {
    x: 100,
    opacity: 0
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

// Glow effect en hover (para botones premium)
export const glowOnHover = {
  boxShadow: "0 0 20px rgba(37, 99, 235, 0.6)",
  scale: 1.02,
  transition: {
    duration: 0.3
  }
};
