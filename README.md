# **StoryPath - Native**

StoryPath - Native is a **location-based experience platform** that allows users to explore virtual museum exhibits, participate in treasure hunts, and engage in interactive tours. The app serves as a companion to the **StoryPath web platform**, which enables content creators to author and publish these experiences. The React Native app makes it easy for users to discover projects, follow clues, scan QR codes, and track their progress.

---

## **Key Features**

- **Project Details & Instructions**: Provides users with an overview of the project they’re participating in.
- **Location Tracking**: Detects when users are near specific locations, automatically updating their progress.
- **QR Code Scanning**: Unlocks location-specific content when users scan a QR code at each location.
- **Score Tracking**: Tracks user scores as they complete locations, with a display of their current score and total possible points.
- **Dynamic Content Display**: Content for each location is displayed in `WebView` components, and dynamically adjusts to fit content.
- **Data Persistence**: Stores user progress and proximity data using AsyncStorage, ensuring data persists between sessions.
- **Pull-to-Refresh**: Users can refresh project data and scores easily via pull-to-refresh.

---

## **Technology Stack**

- **React Native**: Main framework for building the mobile application.
- **Expo**: Used for development and handling geolocation permissions.
- **React Navigation**: Enables navigation between different screens.
- **react-native-webview**: Displays HTML content dynamically.
- **AsyncStorage**: Local storage to persist user data and flags.
- **Geolib**: Calculates distances between user location and target locations.

---

## **Usage Workflow**

1. **Profile Setup:**  
   Set up a profile by adding a username and a photo.
2. **Project Exploration:**  
   Select a project from the list and begin the experience.
3. **Interactive Gameplay:**  
   Unlock locations or scan QR codes to view project content.
4. **Score Tracking:**  
   Monitor progress by viewing your score and locations visited on the map.

---

## Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js** (version 14+ recommended)
- **Expo CLI** (installed globally)
- **Android Studio or Xcode** for emulator testing (optional)

### Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/KiddKailash/StoryPath---Native
   cd StoryPath---Native
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run the Project**:
   ```bash
   npm expo start
   ```

### Running on a Device

- To run the app on a physical device, download the Expo Go app from the App Store (iOS) or Google Play Store (Android).
- Scan the QR code displayed in your terminal after running expo start.
