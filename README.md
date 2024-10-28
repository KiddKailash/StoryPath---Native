StoryPath - Native
StoryPath - Native is a location-based experience platform that allows users to explore virtual museum exhibits, participate in treasure hunts, and engage in interactive tours. The app serves as a companion to the StoryPath web platform, which enables content creators to author and publish these experiences. The React Native app makes it easy for users to discover projects, follow clues, scan QR codes, and track their progress.

Key Features
User Profiles:
Participants can set a username and upload a profile photo, which is stored using AsyncStorage.
Project List:
Browse and select from a list of published projects to explore.
Location-Based Gameplay:
Participants can unlock content by scanning QR codes or entering a project’s location radius.
Interactive Maps:
View unlocked locations and the progress made throughout the project.
Scoring System:
Track points based on activities completed, such as visiting locations or scanning QR codes.
Theme Toggle:
Switch between light and dark modes to match user preferences.
Technology Stack
Frontend Framework: React Native with Expo Router
Backend API Integration: Custom API endpoints for user tracking, projects, and locations
Storage: AsyncStorage for managing user data (e.g., profiles)
UI Components: React Native components with consistent styling
Navigation: Drawer and Tab navigation for seamless user interaction
Usage Workflow
Profile Setup:
Set up a profile by adding a username and a photo.
Project Exploration:
Select a project from the list and begin the experience.
Interactive Gameplay:
Unlock locations or scan QR codes to view project content.
Score Tracking:
Monitor progress by viewing your score and locations visited on the map.
Setup & Deployment
Install Dependencies:
Use npm install to set up the project.
Run the App Locally:
Use expo start to launch the development server.
Push Changes to GitHub:
Use the git-commit.sh script to automate commits and push changes to the repository.
This project offers an engaging way for users to explore location-based content and track their progress, ensuring a smooth and immersive experience.