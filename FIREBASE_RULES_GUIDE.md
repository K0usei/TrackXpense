# Firebase Rules Guide for TrackXpense

This document explains how to deploy and manage Firebase security rules for the TrackXpense application.

## Overview

Firebase security rules are crucial for protecting your data and ensuring that users can only access the data they're authorized to see. TrackXpense uses rules for both Firestore and Firebase Storage.

## Firestore Rules

The Firestore rules are defined in `firestore.rules` and control access to the Firestore database. The rules follow these principles:

1. Users can only read and write their own data
2. Some collections (like categories) are readable by all authenticated users
3. Admin-only operations are restricted to users with admin privileges

## Storage Rules

The Storage rules are defined in `firebase.storage.rules` and control access to files stored in Firebase Storage. The rules ensure that:

1. Users can only access their own receipt images
2. Unauthenticated users cannot access any files

## Deploying Rules

To deploy the rules to Firebase:

1. Make sure you have the Firebase CLI installed:
   ```
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```
   firebase login
   ```

3. Deploy the rules:
   ```
   firebase deploy --only firestore:rules,storage:rules
   ```

## Testing Rules

You can test your rules before deploying them using the Firebase Emulator Suite:

1. Start the emulator:
   ```
   firebase emulators:start
   ```

2. Write and run tests against the emulator to verify your rules work as expected.

## Common Issues

### Missing or Insufficient Permissions

If you see "Missing or insufficient permissions" errors, it usually means one of the following:

1. The user is not authenticated
2. The user is trying to access data they don't own
3. The rules are not properly configured to allow the specific operation

Check the following:
- Ensure the user is properly authenticated
- Verify that documents have the correct `userId` field matching the authenticated user
- Check that your rules allow the specific operation being attempted

### Rules Deployment Failures

If rule deployment fails, check:
- Syntax errors in your rules files
- Proper authentication with Firebase CLI
- Correct project selection in `.firebaserc`

## Best Practices

1. Always test rule changes in the emulator before deploying
2. Use the principle of least privilege - only grant the minimum permissions needed
3. Include validation rules to ensure data integrity
4. Use composite rules for complex access patterns
5. Monitor your Firebase Security Rules in the Firebase console
