import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { UserProfile } from '../types';

const USER_PROFILE_KEY = 'user_profile';

const defaultProfile: UserProfile = {
  username: 'Student',
  disciplineScore: 100,
  streak: 0,
  disciplinePoints: 100,
  isFocusModeActive: false,
};

interface UserState {
  profile: UserProfile;
  isLoading: boolean;
  loadProfile: () => Promise<void>;
  updateDisciplineScore: (change: number) => Promise<void>; // Modified to accept delta
  setFocusMode: (active: boolean) => Promise<void>;
  incrementStreak: () => Promise<void>;
  resetStreak: () => Promise<void>;
  saveProfile: (profile: UserProfile) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: defaultProfile,
  isLoading: true,
  loadProfile: async () => {
    set({ isLoading: true });
    try {
      const profileJson = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (profileJson) {
        const parsed = JSON.parse(profileJson);
        // Merge with default to ensure new fields (points, focusMode) exist
        set({ profile: { ...defaultProfile, ...parsed }, isLoading: false });
      } else {
        await get().saveProfile(defaultProfile);
        set({ profile: defaultProfile, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      set({ isLoading: false });
    }
  },
  updateDisciplineScore: async (change) => {
    const profile = get().profile;
    const newPoints = Math.max(0, Math.min(100, profile.disciplinePoints + change));
    const isActive = newPoints < 50; // Auto-activate if < 50

    const updatedProfile = {
      ...profile,
      disciplinePoints: newPoints,
      disciplineScore: newPoints, // Sync
      isFocusModeActive: isActive
    };

    await get().saveProfile(updatedProfile);
    set({ profile: updatedProfile });
  },
  setFocusMode: async (active) => {
    const profile = get().profile;
    const updatedProfile = { ...profile, isFocusModeActive: active };
    await get().saveProfile(updatedProfile);
    set({ profile: updatedProfile });
  },
  incrementStreak: async () => {
    const profile = get().profile;
    const updatedProfile = { ...profile, streak: profile.streak + 1 };
    await get().saveProfile(updatedProfile);
    set({ profile: updatedProfile });
  },
  resetStreak: async () => {
    const profile = get().profile;
    const updatedProfile = { ...profile, streak: 0 };
    await get().saveProfile(updatedProfile);
    set({ profile: updatedProfile });
  },
  saveProfile: async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  },
}));
