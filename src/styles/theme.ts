/**
 * Sistema de Diseño - Tokens de Diseño
 * Centraliza colores, espaciados, fuentes y otros valores
 * para mantener consistencia visual en toda la app
 */

export const colors = {
  // Colores principales (paleta celeste / azul claro)
  primary: "#00AEEF",        // Celeste vibrante - call to action
  primaryDark: "#008FBE",    // Azul oscuro-acento
  primaryLight: "#E6FBFF",   // Celeste muy claro - fondos/accent
  secondary: "#062C3B",      // Azul muy oscuro - alternativa para textos/headers
  danger: "#E53935",         // Rojo - eliminar / error
  warning: "#FF9800",        // Naranja - alertas

  // Neutros
  background: "#F6FBFD",     // Fondo muy claro con matiz celeste
  white: "#ffffff",
  black: "#000000",

  // Textos
  textPrimary: "#062C3B",    // Texto principal (oscuro con matiz azul)
  textSecondary: "#5B7A87",  // Texto secundario (gris azulado)
  textTertiary: "#9BB0B8",   // Texto deshabilitado

  // Bordes
  border: "#E6F3F7",
  borderLight: "#F3FAFC",

  // Estados
  success: "#2E7D32",
  error: "#E53935",
  info: "#00AEEF",
};

export const spacing = {
  xs: 5,
  sm: 10,
  md: 15,
  lg: 20,
  xl: 30,
  xxl: 40,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 28,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 20,
  round: 50,
};

export const shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,  // Android
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,  // Android
  },
};
