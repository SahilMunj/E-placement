# 🚀 Quick Start Guide - E-Placement Portal

## ✅ Complete Setup in 15 Minutes

Follow these steps to get your E-Placement Portal fully functional.

---

## 📋 **Step 1: Firebase Setup (5 minutes)**

### 1.1 Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name: "e-placement-portal"
4. Click "Create project"

### 1.2 Enable Services
1. **Authentication**:
   - Click "Authentication" → "Get started"
   - Enable "Email/Password"
   - Click "Save"

2. **Firestore Database**:
   - Click "Firestore Database" → "Create database"
   - Start in "Test mode"
   - Choose location → "Enable"

3. **Storage**:
   - Click "Storage" → "Get started"
   - Start in "Test mode" → "Done"

### 1.3 Get Firebase Config
1. Click ⚙️ (Settings) → "Project settings"
2. Scroll to "Your apps"
3. Click Web icon `</>`
4. Register app: "E-Placement Web"
5. Copy the config object

### 1.4 Update Your Code
Open `d:/eplacement/js/firebase-config.js` and update lines 10-15:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",              // ← Paste your values here
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

---

## 🔒 **Step 2: Security Rules (3 minutes)**

### 2.1 Firestore Rules
1. Go to Firebase Console → Firestore Database → Rules
2. Copy ALL content from `d:/eplacement/firestore.rules`
3. Paste in Firebase Console
4. Click "Publish"

### 2.2 Storage Rules
1. Go to Firebase Console → Storage → Rules
2. Copy ALL content from `d:/eplacement/storage.rules`
3. Paste in Firebase Console
4. Click "Publish"

---

## 📧 **Step 3: Email Notifications (5 minutes)**

### 3.1 Create EmailJS Account
1. Go to https://www.emailjs.com/
2. Sign up (free)
3. Verify email

### 3.2 Add Email Service
1. Click "Email Services" → "Add New Service"
2. Choose "Gmail"
3. Connect your Gmail account
4. **Copy Service ID** (e.g., `service_abc123`)

### 3.3 Create Email Template
1. Click "Email Templates" → "Create New Template"
2. **Template Name**: "Placement Notification"
3. **Subject**: `🎯 New Placement: {{company_name}} - {{job_role}}`
4. **Content**:
```
Hello {{to_name}},

A new placement opportunity has been posted:

Company: {{company_name}}
Position: {{job_role}}
Package: {{package}} LPA
Location: {{location}}
Deadline: {{deadline}}

Job Description:
{{job_description}}

Login to apply: {{portal_link}}

Best regards,
E-Placement Portal Team
```
5. Click "Save"
6. **Copy Template ID** (e.g., `template_xyz789`)

### 3.4 Get Public Key
1. Click "Account" → "General"
2. **Copy Public Key** (e.g., `user_abc123`)

### 3.5 Update Email Service Code
Open `d:/eplacement/js/email-service.js` and update lines 6-8:

```javascript
const EMAILJS_PUBLIC_KEY = 'user_abc123';      // ← Your Public Key
const EMAILJS_SERVICE_ID = 'service_abc123';   // ← Your Service ID
const EMAILJS_TEMPLATE_ID = 'template_xyz789'; // ← Your Template ID
```

---

## 🖥️ **Step 4: Run the Application (2 minutes)**

### Option A: Using VS Code Live Server (Recommended)
1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Click "Open with Live Server"
4. Browser opens at `http://127.0.0.1:5500`

### Option B: Using Python
```bash
cd d:/eplacement
python -m http.server 8000
```
Open browser: `http://localhost:8000`

### Option C: Using Node.js
```bash
cd d:/eplacement
npx http-server
```
Open browser: `http://localhost:8080`

---

## 🧪 **Step 5: Test Everything (5 minutes)**

### 5.1 Test Student Registration
1. Open `http://127.0.0.1:5500` (or your local URL)
2. Click "Student Registration"
3. Fill form:
   - Name: Test Student
   - Email: your-email@gmail.com (use your real email)
   - Password: test123
   - Student ID: CS2021001
   - Department: Computer Science
   - Year: 3
4. Click "Create Account"
5. Should redirect to login page

### 5.2 Test Student Login
1. Login with email and password
2. Should see Student Dashboard
3. Check all sections:
   - ✅ Profile
   - ✅ Resume Generator
   - ✅ Placements
   - ✅ Update Profile
   - ✅ Application Forms

### 5.3 Test Faculty Registration
1. Logout
2. Go to homepage
3. Click "Faculty Registration"
4. Fill form:
   - Name: Test Faculty
   - Email: faculty@test.com
   - Password: test123
   - Faculty ID: FAC001
   - Department: Placement Cell
5. Click "Create Account"

### 5.4 Test Faculty Login & Post Placement
1. Login as faculty
2. Go to "Post Placement"
3. Fill form:
   - Company: Google
   - Job Role: Software Engineer
   - Package: 25
   - Location: Bangalore
   - Deadline: (select future date/time)
   - Departments: Computer Science
   - Description: Looking for talented engineers
   - Requirements: B.Tech CS, CGPA > 7.5
   - Link: https://careers.google.com
4. Click "Post Placement"
5. **Check console**: Should show "Emails sent: 1, Failed: 0"

### 5.5 Test Email Notification
1. **Check your email inbox** (the one you used for student registration)
2. You should receive an email about the Google placement
3. If not in inbox, check spam folder
4. Email should contain all placement details

### 5.6 Test Application Form
1. Logout and login as student
2. Go to "Placements" section
3. Click "Apply Now" on Google placement
4. Modal appears → Click "OK, Fill Form"
5. Fill application form
6. Click "Submit Form"
7. Form should appear in "Application Forms" section

### 5.7 Test Student Management
1. Logout and login as faculty
2. Go to "Manage Students"
3. Should see "Test Student" in the list
4. Click "View Profile"
5. Should see all student details
6. Check application history

### 5.8 Test Resume Upload
1. Logout and login as student
2. Go to "Profile" section
3. Upload a PDF resume
4. Click "Upload Resume"
5. Should see "View Uploaded Resume" link
6. Logout and login as faculty
7. View student profile
8. Click "View Resume" → PDF should open

---

## ✅ **Verification Checklist**

After completing all steps, verify:

- [ ] Firebase project created and configured
- [ ] `firebase-config.js` updated with your credentials
- [ ] Firestore rules published
- [ ] Storage rules published
- [ ] EmailJS account created
- [ ] Email service connected (Gmail)
- [ ] Email template created
- [ ] `email-service.js` updated with EmailJS credentials
- [ ] Application running on local server
- [ ] Student can register and login
- [ ] Faculty can register and login
- [ ] Faculty can post placements
- [ ] **Students receive email notifications**
- [ ] Students can apply for placements
- [ ] Students can fill application forms
- [ ] Faculty can view all students
- [ ] Faculty can view student resumes
- [ ] Faculty can see all application forms

---

## 🎯 **Common Issues & Solutions**

### Issue 1: Firebase Connection Error
**Error**: "Firebase: Error (auth/...)"
- ✅ Check `firebase-config.js` has correct credentials
- ✅ Verify Authentication is enabled in Firebase Console
- ✅ Check browser console (F12) for errors

### Issue 2: Emails Not Sending
**Error**: No emails received
- ✅ Check `email-service.js` has correct EmailJS credentials
- ✅ Verify EmailJS service is connected
- ✅ Check spam folder
- ✅ Look at browser console for errors
- ✅ Check EmailJS dashboard for email history

### Issue 3: CORS Error
**Error**: "Access blocked by CORS policy"
- ✅ Don't double-click HTML files
- ✅ Use Live Server or Python/Node server
- ✅ Access via `http://` not `file://`

### Issue 4: Students Not Visible
**Error**: No students in "Manage Students"
- ✅ Register at least one student first
- ✅ Check Firestore Database has `users` collection
- ✅ Verify Firestore rules are published

### Issue 5: Resume Upload Fails
**Error**: Can't upload resume
- ✅ Use PDF files only
- ✅ File size must be < 10MB
- ✅ Check Storage rules are published
- ✅ Verify Storage is enabled in Firebase

---

## 📱 **Access from Mobile/Other Devices**

1. Find your computer's IP address:
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. On mobile/tablet (same WiFi):
   - Open browser
   - Go to: `http://192.168.1.100:5500`

---

## 🚀 **Deploy to Production**

### Deploy to Firebase Hosting

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login**:
   ```bash
   firebase login
   ```

3. **Initialize**:
   ```bash
   cd d:/eplacement
   firebase init hosting
   ```
   - Select your project
   - Public directory: `.` (current directory)
   - Single-page app: No
   - Don't overwrite existing files

4. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```

5. **Access**:
   - Your app will be live at: `https://your-project-id.web.app`

---

## 📞 **Need Help?**

1. **Check Documentation**:
   - `README.md` - Complete documentation
   - `EMAIL_SETUP.md` - Email setup guide
   - `FIXES_APPLIED.md` - Recent fixes
   - `NAVIGATION.md` - Page navigation

2. **Check Browser Console**:
   - Press F12
   - Look for errors in Console tab
   - Check Network tab for failed requests

3. **Check Firebase Console**:
   - Verify data is being saved
   - Check Firestore collections
   - Review Storage files

---

## 🎉 **You're All Set!**

Your E-Placement Portal is now fully functional with:
- ✅ Student and Faculty portals
- ✅ Resume generator with PDF download
- ✅ Placement posting and management
- ✅ **Email notifications to students**
- ✅ **Application form submission**
- ✅ **Student management with resume viewing**
- ✅ Automatic placement expiry
- ✅ Secure authentication and data storage

**Start using your portal and manage placements efficiently!** 🚀
