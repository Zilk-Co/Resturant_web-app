let messaging: any = null;

const VAPID_KEY = "BGXvAx_TmoB0SoLQ72oLylWhelSdZhvyMU6qfTlxF8D_sSzsZRTqXItz9FeF9EVb-UoLVnaU8tckZUtTe8CQCW0";

export async function initializePushNotifications(): Promise<boolean> {
  try {
    if (!("Notification" in window)) return false;
    if (!("serviceWorker" in navigator)) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const firebase = (window as any).firebase;
    if (!firebase) return false;

    messaging = firebase.messaging();
    const token = await messaging.getToken({ vapidKey: VAPID_KEY });

    if (token) {
      console.log("FCM Token:", token);
      localStorage.setItem("thb_fcm_token", token);
      return true;
    }
    return false;
  } catch (error) {
    console.log("Push notifications not available:", error);
    return false;
  }
}

export async function sendTokenToServer(userId: string): Promise<void> {
  const token = localStorage.getItem("thb_fcm_token");
  if (!token) return;
  try {
    await fetch("/api/mobile/fcm-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, token }),
    });
  } catch {}
}

export function onMessageListener(callback: (payload: any) => void): void {
  if (!messaging) return;
  messaging.onMessage((payload: any) => {
    callback(payload);
  });
}
