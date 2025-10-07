# Piano App Firebase Setup

## 🎹 Firebase Integration for Vote System

Your Piano App is already configured with Firebase for the voting system. Here's what's been set up:

### 📊 Current Configuration

**Firebase Project:** `ali-piano`
- **Project ID:** ali-piano  
- **Database:** Cloud Firestore
- **Authentication:** Google Auth & Email/Password
- **Hosting:** Firebase Hosting ready

### 🗳️ Voting System Structure

The app uses the following Firestore collections:

```
/feedback/pianoFeedback
{
  likes: number,
  dislikes: number,
  lastUpdated: timestamp
}

/tabData/{userId}_{tabName}
{
  owner: userId,
  name: string,
  data: object,
  timestamp: timestamp
}
```

### 🔒 Security Rules

The Firestore rules allow:
- **Public voting**: Anyone can read/write votes in `/feedback/` collection
- **User tab data**: Only authenticated users can manage their own tabs
- **Test connections**: Public read access for connectivity tests

### 🚀 Deployment Instructions

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Deploy Rules & Hosting**:
   ```bash
   # Make deployment script executable
   chmod +x deploy.sh
   
   # Run deployment
   ./deploy.sh
   ```

   Or manually:
   ```bash
   firebase login
   firebase deploy --only firestore:rules
   firebase deploy --only hosting
   ```

3. **Verify Setup**:
   - Check Firebase Console: https://console.firebase.google.com/project/ali-piano
   - Test voting system in your app
   - Verify real-time vote synchronization

### 🎛️ Features Working

✅ **Real-time Vote Sync**: Votes update instantly across all devices  
✅ **Offline Support**: LocalStorage fallback when offline  
✅ **User Authentication**: Google & Email login  
✅ **Tab Management**: Save/load user piano tabs  
✅ **Cross-device Compatibility**: Works on all devices  

### 🔧 Troubleshooting

**If votes aren't saving:**
1. Check Firebase Console for rule deployment
2. Verify network connectivity
3. Check browser console for errors
4. Ensure Firebase config is correct in main.js

**If authentication fails:**
1. Verify Firebase Auth is enabled in console
2. Check auth domain settings
3. Ensure login modal is working

### 📱 Testing

Test the following features:
- [ ] Like/Dislike voting
- [ ] Real-time vote updates
- [ ] User registration/login
- [ ] Tab saving/loading
- [ ] Cross-device synchronization

For support, check the Firebase Console logs and browser developer tools.