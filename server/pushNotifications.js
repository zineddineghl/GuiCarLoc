/**
 * Expo Push Notifications — API gratuite, pas besoin de Firebase
 * Doc : https://docs.expo.dev/push-notifications/sending-notifications/
 */

async function sendPushNotification(expoPushToken, title, body, data = {}) {
  if (!expoPushToken) return;
  if (!expoPushToken.startsWith('ExponentPushToken')) return;

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
      }),
    });
  } catch (err) {
    console.error('Push notification error:', err);
  }
}

module.exports = { sendPushNotification };
