import { AppState, AppStateStatus, Platform } from 'react-native';
import { useUserStore } from '@/store/userStore';

// Type-only import to preserve TypeScript type safety.
// This does not load the module at runtime.
type NotificationsModule = typeof import('expo-notifications');

let focusModeActive = false;
let appStateSubscription: any | null = null;
let backgroundTimer: NodeJS.Timeout | null = null;
let Notifications: NotificationsModule | null = null;

// This function dynamically loads the notifications module and sets it up.
const initializeNotifications = async (): Promise<boolean> => {
  // Return false if on the server
  if (Platform.OS === 'web' && typeof window === 'undefined') {
    return false;
  }

  // If already loaded, do nothing.
  if (Notifications) {
    return true;
  }
  
  try {
    const notificationsModule = await import('expo-notifications');
    Notifications = notificationsModule;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    return true;
  } catch (e) {
    console.error('Failed to load expo-notifications', e);
    return false;
  }
};

const handleAppStateChange = (nextAppState: AppStateStatus) => {
  if (nextAppState === 'background' && focusModeActive) {
    backgroundTimer = setTimeout(async () => {
      // Ensure Notifications is loaded before trying to use it
      if (!Notifications) return;

      const { profile, updateDisciplineScore } = useUserStore.getState();
      const newScore = profile.disciplineScore - 5;
      
      updateDisciplineScore(newScore);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Focus Lost!',
          body: `You lost 5 discipline points for leaving the app. New score: ${newScore}`,
        },
        trigger: null,
      });
    }, 5000);
  } else if (nextAppState === 'active') {
    if (backgroundTimer) {
      clearTimeout(backgroundTimer);
      backgroundTimer = null;
    }
  }
};

const startFocusMode = async () => {
  if (focusModeActive) return;

  const isClient = await initializeNotifications();
  if (!isClient || !Notifications) {
    alert('Notifications are not available on this platform.');
    return;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('You need to enable notifications for the focus mode to work correctly.');
    return;
  }

  focusModeActive = true;
  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
  console.log('Focus Mode Started');
};

const stopFocusMode = () => {
  if (!focusModeActive) return;

  focusModeActive = false;
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
  if (backgroundTimer) {
      clearTimeout(backgroundTimer);
      backgroundTimer = null;
  }
  console.log('Focus Mode Stopped');
};

const isFocusModeActive = () => {
    return focusModeActive;
}

export const focusModeService = {
  startFocusMode,
  stopFocusMode,
  isFocusModeActive
};
