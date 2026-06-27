import { NotificationTone, ScreenName } from './core';

export interface AppNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  group: string;
  tone: NotificationTone;
  read: boolean;
  screen: ScreenName;
}
