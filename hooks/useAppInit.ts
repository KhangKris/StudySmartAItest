import { useEffect, useState } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useUserStore } from '../store/userStore';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export const useAppInit = () => {
  const [appIsReady, setAppIsReady] = useState(false);
  const initializeDatabase = useTaskStore(state => state.initializeDatabase);
  const loadProfile = useUserStore(state => state.loadProfile);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Pre-load fonts, make API calls, or initialize data here
        await initializeDatabase();
        await loadProfile();
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        SplashScreen.hideAsync();
      }
    };

    prepare();
  }, []);

  return appIsReady;
};
