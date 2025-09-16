/**
 * Formatea un precio para mostrar en Quetzales guatemaltecos
 */
export const formatPrice = (price: number): string => {
  return `Q${price.toLocaleString('es-GT')}`;
};

/**
 * Formatea un precio de manera compacta para espacios reducidos
 */
export const formatPriceCompact = (price: number): string => {
  return `Q${price}`;
};