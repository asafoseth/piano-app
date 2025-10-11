# 🔒 Firebase Permission Fix Guide

## The Problem
Your Firestore database is blocking writes with "missing or insufficient permission" error.

## 🚀 SOLUTION: Update Firebase Security Rules

### Step 1: Go to Firebase Console
1. Visit: https://console.firebase.google.com
2. Select your project: **ali-piano**

### Step 2: Navigate to Firestore Rules
1. Click "Firestore Database" in left sidebar
2. Click "Rules" tab at the top

### Step 3: Update Security Rules
Replace your current rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read/write access to feedback collection
    match /feedback/{document} {
      allow read, write: if true;
    }
    
    // Keep TAB data secure (require authentication)
    match /tabData/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.owner;
    }
    
    // Default rule for other collections (require authentication)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 4: Publish Rules
1. Click the **"Publish"** button
2. Wait for confirmation

## 🧪 Test the Fix

### Option 1: Use Test File
1. Open `test-feedback.html` in your browser
2. Check connection status
3. Try clicking like/dislike buttons

### Option 2: Use Main App
1. Open your main piano app
2. Check browser console (F12)
3. Look for "✅ Firebase connection and permissions test successful"
4. Try the feedback buttons

### Option 3: Browser Console Test
1. Open your app
2. Press F12 (developer tools)
3. Run: `initializeFeedbackDocument()`
4. Should see "✅ Feedback document created successfully!"

## 📊 What This Rule Does

- **`/feedback/{document}`** - Allows anyone to read/write feedback data
- **`/tabData/{document}`** - Keeps user TAB data secure (only owner can access)
- **Default rule** - Other collections require authentication

## 🔍 Verify It's Working

After updating rules, you should see:
- ✅ No more permission errors
- ✅ Like/dislike counts work
- ✅ Data saves to Firestore
- ✅ Console shows success messages

## 🆘 If Still Not Working

1. **Double-check rules are published**
2. **Wait 30 seconds** for rules to propagate
3. **Refresh your app**
4. **Check browser console** for new error messages

## 🔐 Security Note

This setup allows public access to feedback collection only. Your user TAB data remains secure and requires authentication.