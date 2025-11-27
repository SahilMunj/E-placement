# E-Placement Portal

A comprehensive web application for managing college placement activities, built with HTML, TailwindCSS, JavaScript, and Firebase.

## Features

### Student Portal
1. **Profile Management** - View and manage personal details
2. **Resume Generator** - Create professional resumes with PDF download
3. **Placements** - Browse and apply for placement opportunities
4. **Update Profile** - Edit personal information
5. **Application Forms** - Submit and track placement applications
6. **Resume Upload** - Upload generated resumes in PDF format

### Faculty Portal
1. **Profile Management** - View faculty profile
2. **Post Placement** - Create new placement opportunities with deadlines
3. **Manage Posts** - Edit or delete placement posts
4. **Manage Students** - View all registered students and their profiles
5. **Manage Forms** - Track student applications and placement status
6. **Update Profile** - Edit faculty information

### Key Functionalities
- **Authentication** - Separate login/registration for students and faculty
- **Email Notifications** - Students receive notifications for new placements
- **Automatic Expiry** - Expired placements are automatically removed
- **Application Tracking** - Faculty can monitor all student applications
- **Resume Management** - Generate, preview, and download professional resumes
- **Modal Alerts** - Students are prompted to fill forms after applying

## Technology Stack

- **Frontend**: HTML5, TailwindCSS, JavaScript (ES6+)
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Libraries**: 
  - Font Awesome (Icons)
  - html2pdf.js (PDF generation)
  - Firebase SDK v10.7.1

## Setup Instructions

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable the following services:
   - **Authentication** (Email/Password provider)
   - **Firestore Database**
   - **Storage**

4. Get your Firebase configuration:
   - Go to Project Settings > Your apps
   - Click on Web app (</>) icon
   - Copy the configuration object

5. Update `js/firebase-config.js` with your Firebase credentials:
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

### 2. Firestore Database Setup

Create the following collections in Firestore:

1. **users** - Stores student and faculty profiles
   ```
   Structure:
   - fullName (string)
   - email (string)
   - phone (string)
   - role (string: 'student' or 'faculty')
   - For students: studentId, department, year, resumeUrl
   - For faculty: facultyId, department
   ```

2. **placements** - Stores placement opportunities
   ```
   Structure:
   - companyName (string)
   - jobRole (string)
   - package (string)
   - location (string)
   - deadline (string/timestamp)
   - eligibleDepartments (array)
   - jobDescription (string)
   - requirements (string)
   - applicationLink (string)
   - postedBy (string)
   - postedByName (string)
   - postedAt (timestamp)
   ```

3. **applicationForms** - Stores student applications
   ```
   Structure:
   - studentId (string)
   - studentName (string)
   - studentEmail (string)
   - department (string)
   - year (string)
   - companyName (string)
   - position (string)
   - applicationDate (string)
   - applicationStatus (string)
   - notes (string)
   - submittedAt (timestamp)
   ```

4. **notifications** - Stores email notifications
   ```
   Structure:
   - userId (string)
   - userEmail (string)
   - type (string)
   - placementId (string)
   - companyName (string)
   - jobRole (string)
   - message (string)
   - sentAt (timestamp)
   - read (boolean)
   ```

### 3. Firestore Security Rules

Set up the following security rules in Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Placements collection
    match /placements/{placementId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'faculty';
      allow update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'faculty';
    }
    
    // Application forms
    match /applicationForms/{formId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && (
        resource.data.studentId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'faculty'
      );
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

### 4. Storage Rules

Set up the following security rules for Firebase Storage:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /resumes/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Email Notifications Setup (Optional)

For automated email notifications, you can:

1. **Option A**: Use Firebase Cloud Functions with SendGrid/Nodemailer
2. **Option B**: Use a third-party service like Zapier
3. **Option C**: Implement server-side email sending

Example Cloud Function (requires Firebase Blaze plan):
```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

exports.sendPlacementNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    
    // Configure your email service
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password'
      }
    });
    
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: notification.userEmail,
      subject: `New Placement: ${notification.companyName}`,
      html: `
        <h2>New Placement Opportunity</h2>
        <p><strong>Company:</strong> ${notification.companyName}</p>
        <p><strong>Role:</strong> ${notification.jobRole}</p>
        <p>${notification.message}</p>
        <p>Login to the portal to apply: <a href="YOUR_PORTAL_URL">E-Placement Portal</a></p>
      `
    };
    
    await transporter.sendMail(mailOptions);
  });
```

### 6. Running the Application

1. **Local Development**:
   - Use a local server (e.g., Live Server extension in VS Code)
   - Or use Python: `python -m http.server 8000`
   - Or use Node.js: `npx http-server`

2. **Access the application**:
   - Open `index.html` in your browser
   - Or navigate to `http://localhost:8000` (if using a server)

3. **Test the application**:
   - Register as a student
   - Register as a faculty member
   - Login with respective credentials
   - Test all features

### 7. Deployment

Deploy to Firebase Hosting:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select Hosting and your project
# Set public directory to current directory (.)
# Configure as single-page app: No

# Deploy
firebase deploy
```

## Project Structure

```
eplacement/
├── index.html              # Landing page
├── login.html              # Login page
├── register.html           # Registration page
├── student-dashboard.html  # Student portal
├── faculty-dashboard.html  # Faculty portal
├── js/
│   ├── firebase-config.js  # Firebase configuration
│   ├── login.js           # Login functionality
│   ├── register.js        # Registration functionality
│   ├── student-dashboard.js # Student portal logic
│   └── faculty-dashboard.js # Faculty portal logic
└── README.md              # This file
```

## Usage Guide

### For Students:
1. Register with your college email and student ID
2. Complete your profile with department and year
3. Generate a professional resume using the Resume Generator
4. Browse available placements in the Placements section
5. Click "Apply Now" to open the application link
6. Fill the application form to track your application
7. Upload your generated resume to your profile

### For Faculty:
1. Register with your faculty ID and department
2. Post new placement opportunities with company details and deadlines
3. Manage existing posts (edit or delete)
4. View all registered students and their profiles
5. Access student resumes from their profiles
6. Track all student applications in the Manage Forms section
7. Filter applications by company or search by student name

## Features in Detail

### Resume Generator
- Professional template with sections for:
  - Personal information
  - Objective
  - Education
  - Skills
  - Experience
  - Projects
- Live preview as you type
- Download as PDF with one click

### Placement Management
- Automatic deadline tracking
- Auto-deletion of expired placements
- Department-wise filtering
- Email notifications to eligible students

### Application Tracking
- Students can track their applications
- Faculty can view all applications
- Filter by company or student
- Search functionality

## Troubleshooting

### Common Issues:

1. **Firebase not connecting**:
   - Check if firebase-config.js has correct credentials
   - Verify Firebase services are enabled

2. **Login/Registration not working**:
   - Enable Email/Password authentication in Firebase Console
   - Check browser console for errors

3. **PDF download not working**:
   - Ensure html2pdf.js library is loading
   - Check browser console for errors

4. **Images/Resumes not uploading**:
   - Verify Storage is enabled in Firebase
   - Check Storage rules are correctly set

5. **Email notifications not sending**:
   - Implement Cloud Functions (requires Blaze plan)
   - Or use alternative email service

## Security Considerations

- Never commit firebase-config.js with real credentials to public repositories
- Use environment variables for sensitive data in production
- Implement proper Firestore security rules
- Validate all user inputs on both client and server side
- Use HTTPS in production

## Future Enhancements

- Interview scheduling system
- Chat functionality between students and faculty
- Analytics dashboard for placement statistics
- Mobile app version
- Integration with LinkedIn
- Automated resume parsing
- Video interview integration
- Company portal for direct posting

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Firebase documentation
3. Check browser console for errors
4. Verify all setup steps are completed

## License

This project is created for educational purposes.

---

**Note**: Remember to replace all placeholder values (YOUR_API_KEY, etc.) with your actual Firebase configuration before deploying.
