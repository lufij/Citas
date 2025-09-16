export interface NotificationSettings {
  enabled: boolean;
  alertTimes: number[]; // Minutos antes de la cita
  vibration: boolean;
  sound: boolean;
  showInApp: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  alertTimes: [20, 10, 5],
  vibration: true,
  sound: false, // Deshabilitado por defecto para evitar molestias
  showInApp: true
};

const SETTINGS_KEY = 'barberapp_notification_settings';

/**
 * Obtiene la configuración de notificaciones del usuario
 */
export const getNotificationSettings = (): NotificationSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.warn('Error loading notification settings:', error);
  }
  
  return DEFAULT_SETTINGS;
};

/**
 * Guarda la configuración de notificaciones del usuario
 */
export const saveNotificationSettings = (settings: NotificationSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Error saving notification settings:', error);
  }
};

/**
 * Verifica si las notificaciones están habilitadas para un tiempo específico
 */
export const isNotificationEnabledForTime = (minutesBefore: number): boolean => {
  const settings = getNotificationSettings();
  return settings.enabled && settings.alertTimes.includes(minutesBefore);
};

/**
 * Verifica si la vibración está habilitada
 */
export const isVibrationEnabled = (): boolean => {
  const settings = getNotificationSettings();
  return settings.enabled && settings.vibration;
};

/**
 * Verifica si el sonido está habilitado
 */
export const isSoundEnabled = (): boolean => {
  const settings = getNotificationSettings();
  return settings.enabled && settings.sound;
};

/**
 * Verifica si las notificaciones en la app están habilitadas
 */
export const isInAppNotificationEnabled = (): boolean => {
  const settings = getNotificationSettings();
  return settings.enabled && settings.showInApp;
};