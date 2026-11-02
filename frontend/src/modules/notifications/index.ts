// Public API of the notifications module. Other modules and the app shell import only from here.
export { getUnreadNotificationCount, notificationKeys, updateNotificationSettings } from './api';
export { requestPermissionAndRegister, unregisterThisDevice } from './utils/push';
