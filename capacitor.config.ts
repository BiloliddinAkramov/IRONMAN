import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uz.ironman.app',
  appName: 'IRONMAN',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_ironman',
      iconColor: '#2563EB',
      sound: 'beep.wav',
    },
  },
};

export default config;
