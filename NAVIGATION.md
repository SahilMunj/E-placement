# E-Placement Portal - Navigation Guide

## 🔗 Page Links Overview

### **Homepage (index.html)**
- **URL**: `index.html` or `/`
- **Links to**:
  - Login Page → `login.html` (both Student Login and Faculty Login buttons)
  - Register Page → `register.html` (both Student Registration and Faculty Registration buttons)
  - Logo → `index.html` (returns to homepage)

### **Login Page (login.html)**
- **URL**: `login.html`
- **Links to**:
  - Register Page → `register.html` ("Register here" link)
  - Homepage → `index.html` ("Back to Home" link)
  - **After successful login**:
    - Students → `student-dashboard.html`
    - Faculty → `faculty-dashboard.html`

### **Register Page (register.html)**
- **URL**: `register.html`
- **Links to**:
  - Login Page → `login.html` ("Login here" link)
  - Homepage → `index.html` ("Back to Home" link)
  - **After successful registration** → `login.html` (auto-redirect after 2 seconds)

### **Student Dashboard (student-dashboard.html)**
- **URL**: `student-dashboard.html`
- **Access**: Only after student login
- **Sections** (internal navigation):
  1. Profile
  2. Resume Generator
  3. Placements
  4. Update Profile
  5. Application Forms
- **Links to**:
  - Logout → `login.html` (clears session)

### **Faculty Dashboard (faculty-dashboard.html)**
- **URL**: `faculty-dashboard.html`
- **Access**: Only after faculty login
- **Sections** (internal navigation):
  1. Profile
  2. Post Placement
  3. Manage Posts
  4. Manage Students
  5. Manage Forms
  6. Update Profile
- **Links to**:
  - Logout → `login.html` (clears session)

---

## 🎯 User Flow Diagrams

### **Student Flow**
```
index.html 
    ↓ (Click "Student Registration")
register.html (Fill student details)
    ↓ (Submit)
login.html (Auto-redirect)
    ↓ (Login with credentials)
student-dashboard.html
    ↓ (Use all features)
    ↓ (Click Logout)
login.html
```

### **Faculty Flow**
```
index.html 
    ↓ (Click "Faculty Registration")
register.html (Fill faculty details)
    ↓ (Submit)
login.html (Auto-redirect)
    ↓ (Login with credentials)
faculty-dashboard.html
    ↓ (Manage placements & students)
    ↓ (Click Logout)
login.html
```

---

## 📋 All Navigation Links Summary

| From Page | Link Text | Goes To | Type |
|-----------|-----------|---------|------|
| **index.html** | Logo/Title | index.html | Link |
| **index.html** | Student Login | login.html | Link |
| **index.html** | Faculty Login | login.html | Link |
| **index.html** | Student Registration | register.html | Link |
| **index.html** | Faculty Registration | register.html | Link |
| **login.html** | Register here | register.html | Link |
| **login.html** | Back to Home | index.html | Link |
| **login.html** | Login button | student-dashboard.html OR faculty-dashboard.html | Form Submit |
| **register.html** | Login here | login.html | Link |
| **register.html** | Back to Home | index.html | Link |
| **register.html** | Create Account | login.html | Form Submit (auto-redirect) |
| **student-dashboard.html** | Logout | login.html | Button |
| **faculty-dashboard.html** | Logout | login.html | Button |

---

## ✅ All Pages Are Now Connected!

Every page has proper navigation:
- ✅ Homepage links to Login and Register
- ✅ Login page links to Register and Homepage
- ✅ Register page links to Login and Homepage
- ✅ Dashboards have Logout functionality
- ✅ Logo is clickable and returns to homepage
- ✅ All buttons and links work properly

---

## 🚀 Testing Navigation

1. **Start at Homepage** (`index.html`)
2. **Click "Student Registration"** → Should go to `register.html`
3. **Click "Back to Home"** → Should return to `index.html`
4. **Click "Student Login"** → Should go to `login.html`
5. **Click "Register here"** → Should go to `register.html`
6. **Register a student** → Should auto-redirect to `login.html`
7. **Login as student** → Should go to `student-dashboard.html`
8. **Click "Logout"** → Should return to `login.html`

All navigation is now working! 🎉
