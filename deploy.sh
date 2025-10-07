#!/bin/bash

# Firebase Deployment Script for Piano App
echo "🎹 Piano App Firebase Deployment"
echo "================================"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

echo "🔐 Logging into Firebase..."
firebase login

echo "📋 Deploying Firestore Rules..."
firebase deploy --only firestore:rules

echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "✅ Deployment Complete!"
echo "📊 Your Piano App is now live with Firebase voting system!"
echo "🔗 Check your Firebase console for the deployed rules and hosting URL."