# Sports Platform Notification System

This document outlines the notification system for coaches and players in the sports platform.

## Overview

The notification system enables real-time communication between coaches, players, and the system. Notifications are used to inform users about various events, including:

- Training schedules and updates
- Match information
- Player performance updates
- Team announcements
- Payment reminders
- Attendance updates

## Technical Implementation

### Models

The notification system uses the `Notification` model that includes:

- `recipient`: User receiving the notification
- `sender`: User sending the notification (optional, can be system)
- `type`: Type of notification (e.g., training_scheduled, player_performance)
- `title`: Short heading for the notification
- `message`: Detailed notification content
- `relatedTo`: Reference to related entity (model and ID)
- `isRead`: Flag indicating if notification has been read
- `createdAt`: Timestamp of notification creation

### Services

The notification service (`notificationService.js`) provides utility functions to create and manage notifications:

1. `createNotification(notificationData)`: Create a notification for a specific user
2. `createRoleNotifications(notificationData)`: Create notifications for all users with a specific role
3. `notifyCoachesAboutPlayer(notificationData)`: Create notifications for coaches about player activities
4. `notifyPlayerFromCoach(notificationData)`: Notify a player about coach-related activities
5. `notifyTeamPlayers(notificationData)`: Create notifications for all players in a specific team

### Controller

The notification controller (`notificationController.js`) provides REST API endpoints for:

- Getting user notifications
- Marking notifications as read
- Getting unread notification count
- Creating notifications (admin only)
- Deleting notifications

### Routes

Notification routes are defined in `routes/index.js`:

```javascript
// Notification routes
router.get('/notifications', auth, notificationController.getUserNotifications);
router.put('/notifications/:id', auth, notificationController.markAsRead);
router.put('/notifications/read-all', auth, notificationController.markAllAsRead);
router.delete('/notifications/:id', auth, notificationController.deleteNotification);
router.get('/notifications/unread-count', auth, notificationController.getUnreadCount);
router.post('/notifications', [auth, adminOrSupport], notificationController.createNotification);
```

## Notification Types

The system supports various notification types:

1. `new_registration`: New user registration
2. `role_change`: User role has changed
3. `document_upload`: New document uploaded
4. `system`: System-related notifications
5. `child_account_linked`: Child account linked to parent
6. `training_scheduled`: New training scheduled
7. `training_updated`: Training details updated
8. `training_cancelled`: Training cancelled
9. `match_scheduled`: New match scheduled
10. `match_updated`: Match details updated
11. `match_result`: Match results posted
12. `player_performance`: Player performance stats updated
13. `coach_feedback`: Feedback from coach
14. `team_announcement`: Announcement for team
15. `payment_reminder`: Payment due reminder
16. `attendance_update`: Attendance status update
17. `registration_expiry`: Player registration expiry notification

## Registration Expiry Notifications

The system automatically checks for player registrations that are about to expire and sends notifications to:
1. The player themselves
2. The player's parent (if applicable)

Notifications are sent at two intervals:
- 7 days (one week) before expiry
- 1 day before expiry

Additionally, when a registration has expired (the day after expiry), the system:
- Sends notifications to all admin users
- Provides details about the expired registration (player name, email, and sports)

The notification process is handled by:
1. A daily scheduled job that runs at 9:00 AM to check for upcoming expirations (server/utils/scheduler.js)
2. A daily scheduled job that runs at 10:00 AM to check for expired registrations (server/utils/scheduler.js)
3. A dedicated checker function that identifies upcoming expirations and expired registrations (server/utils/registrationExpiryChecker.js)
4. A notification service that creates the actual notifications (server/utils/notificationService.js)

For manual testing, a script is available at `server/scripts/checkRegistrationExpiry.js` that can be run with:
```
node scripts/checkRegistrationExpiry.js
```

This script will check for both upcoming expirations and already expired registrations.

This feature helps ensure players and parents are reminded to renew their registrations before they expire, and admins are notified about expired registrations that need attention.

## Integration Examples

### Training Plan Notifications

When a new training plan is created, notifications are sent to:
- All coaches (to inform them about the training)
- All players in the team (to inform them about the scheduled training)

Example:

```javascript
// Notify all coaches about the new training plan
await notificationService.createRoleNotifications({
  role: 'coach',
  senderId: req.user.id,
  type: 'training_scheduled',
  title: 'New Training Plan',
  message: `A new training plan "${title}" has been scheduled for ${new Date(date).toLocaleDateString()}`,
  relatedTo: {
    model: 'TrainingPlan',
    id: trainingPlan._id
  }
});

// Notify all players in the team
await notificationService.notifyTeamPlayers({
  teamId: team,
  senderId: req.user.id,
  type: 'training_scheduled',
  title: 'New Training Scheduled',
  message: `A new training session "${title}" has been scheduled for ${new Date(date).toLocaleDateString()}`,
  relatedTo: {
    model: 'TrainingPlan',
    id: trainingPlan._id
  }
});
```

### Player Stats Notifications

When player stats are updated:
- Other coaches are notified about the player's performance
- The player is notified about their updated stats

Example:

```javascript
// Notify other coaches about the player stats update
await notificationService.notifyCoachesAboutPlayer({
  playerId: player,
  type: 'player_performance',
  title: 'Player Stats Updated',
  message: `Performance metrics have been updated for ${playerUser.firstName} ${playerUser.lastName}`,
  relatedTo: {
    model: 'PlayerStats',
    id: playerStats._id
  }
});

// Also notify the player about their updated stats
await notificationService.createNotification({
  recipientId: player,
  senderId: req.user.id,
  type: 'player_performance',
  title: 'Your Performance Stats',
  message: `Coach has updated your performance metrics for ${new Date(matchDate).toLocaleDateString()}`,
  relatedTo: {
    model: 'PlayerStats',
    id: playerStats._id
  }
});
```

## Frontend Integration

The frontend uses:
- `NotificationBadge.js`: Component that displays a badge with unread notifications count and a dropdown menu
- `NotificationList.js`: Component that displays a full list of notifications
- `notificationService.js`: Service that handles API calls for notifications

## Best Practices

1. Always include clear and specific messages
2. Include relevant timestamps and user names
3. Group notifications by type when possible
4. Include reference to related entities for deep linking
5. Clean up old notifications periodically 