import admin from '../lib/firebase.js';

export async function sendTaskNotification(fcmToken, taskData, reportData) {
  if (!fcmToken) {
    console.log('No FCM token provided, skipping push notification');
    return null;
  }

  const payload = {
    notification: {
      title: "नई Task आई है! 🙏",
      body: `${reportData.title} - ${reportData.location}`
    },
    data: {
      taskId: String(taskData.id),
      reportCategory: String(reportData.category),
      urgencyScore: String(reportData.urgency_score),
      locationLat: String(reportData.lat),
      locationLng: String(reportData.lng),
      deepLink: `/tasks` // Or /volunteer/tasks/[taskId] depending on router design. We use /tasks.
    },
    token: fcmToken
  };

  try {
    const response = await admin.messaging().send(payload);
    console.log('Successfully sent FCM message:', response);
    return response;
  } catch (error) {
    console.error('Error sending FCM message:', error);
    return null;
  }
}
