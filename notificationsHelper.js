import { Platform } from 'react-native';

let Notifications = null;

// Dynamically import expo-notifications, catching any Expo Go crash
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.log('expo-notifications unavailable in this environment:', e.message);
}

export const isNotificationsAvailable = () => Notifications !== null;

export const scheduleNotification = async (title, body) => {
  if (!Notifications) {
    console.log('Notification skipped (library unavailable)');
    return;
  }
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null, // Send immediately
    });
  } catch (err) {
    console.log('Failed to schedule notification:', err.message);
  }
};

export const setNotificationHandler = () => {
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};
