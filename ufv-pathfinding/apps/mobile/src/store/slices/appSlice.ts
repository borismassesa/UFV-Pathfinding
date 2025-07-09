import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  isLoading: boolean;
  isOnline: boolean;
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }[];
  errors: {
    id: string;
    message: string;
    timestamp: Date;
    dismissed: boolean;
  }[];
  settings: {
    hapticFeedback: boolean;
    soundEnabled: boolean;
    autoDownloadMaps: boolean;
    dataUsageMode: 'wifi' | 'cellular' | 'all';
    language: 'en' | 'fr' | 'es';
  };
  onboarding: {
    completed: boolean;
    currentStep: number;
    skipped: boolean;
  };
}

const initialState: AppState = {
  isLoading: false,
  isOnline: true,
  theme: 'auto',
  notifications: [],
  errors: [],
  settings: {
    hapticFeedback: true,
    soundEnabled: true,
    autoDownloadMaps: true,
    dataUsageMode: 'all',
    language: 'en',
  },
  onboarding: {
    completed: false,
    currentStep: 0,
    skipped: false,
  },
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },
    
    addNotification: (state, action: PayloadAction<{
      type: 'info' | 'success' | 'warning' | 'error';
      title: string;
      message: string;
    }>) => {
      const notification = {
        id: Date.now().toString(),
        ...action.payload,
        timestamp: new Date(),
        read: false,
      };
      state.notifications.unshift(notification);
      // Keep only last 50 notifications
      state.notifications = state.notifications.slice(0, 50);
    },
    
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    addError: (state, action: PayloadAction<string>) => {
      const error = {
        id: Date.now().toString(),
        message: action.payload,
        timestamp: new Date(),
        dismissed: false,
      };
      state.errors.unshift(error);
      // Keep only last 10 errors
      state.errors = state.errors.slice(0, 10);
    },
    
    dismissError: (state, action: PayloadAction<string>) => {
      const error = state.errors.find(e => e.id === action.payload);
      if (error) {
        error.dismissed = true;
      }
    },
    
    clearErrors: (state) => {
      state.errors = [];
    },
    
    updateSettings: (state, action: PayloadAction<Partial<AppState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    completeOnboarding: (state) => {
      state.onboarding.completed = true;
    },
    
    skipOnboarding: (state) => {
      state.onboarding.skipped = true;
      state.onboarding.completed = true;
    },
    
    setOnboardingStep: (state, action: PayloadAction<number>) => {
      state.onboarding.currentStep = action.payload;
    },
  },
});

export const {
  setLoading,
  setOnlineStatus,
  setTheme,
  addNotification,
  markNotificationAsRead,
  clearNotifications,
  addError,
  dismissError,
  clearErrors,
  updateSettings,
  completeOnboarding,
  skipOnboarding,
  setOnboardingStep,
} = appSlice.actions;

export default appSlice.reducer;