# Email Notification Setup Guide

## 🎯 Overview

This guide explains how to set up email notifications for the E-Placement Portal. When faculty posts a placement, eligible students will receive email notifications.

---

## ✅ **Recommended Method: EmailJS (Free & Easy)**

EmailJS is a free service that allows sending emails directly from JavaScript without a backend server.

### **Step 1: Create EmailJS Account**

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" (free account)
3. Verify your email address

### **Step 2: Add Email Service**

1. After login, go to **Email Services**
2. Click "Add New Service"
3. Choose your email provider:
   - **Gmail** (recommended for testing)
   - Outlook
   - Yahoo
   - Or custom SMTP
4. Click "Connect Account"
5. For Gmail:
   - Enter your Gmail address
   - Click "Create Service"
   - Note down the **Service ID** (e.g., `service_abc123`)

### **Step 3: Create Email Template**

1. Go to **Email Templates**
2. Click "Create New Template"
3. Use this template:

```html
Subject: 🎯 New Placement: {{company_name}} - {{job_role}}

Body:
Hello {{to_name}},

A new placement opportunity has been posted that matches your profile:

Company: {{company_name}}
Position: {{job_role}}
Package: {{package}} LPA
Location: {{location}}
Deadline: {{deadline}}

Job Description:
{{job_description}}

Application Link: {{application_link}}

Login to the E-Placement Portal to view full details and apply:
{{portal_link}}

Don't miss this opportunity!

Best regards,
E-Placement Portal Team
```

4. Click "Save"
5. Note down the **Template ID** (e.g., `template_xyz789`)

### **Step 4: Get Public Key**

1. Go to **Account** → **General**
2. Find your **Public Key** (e.g., `user_abc123xyz`)
3. Copy it

### **Step 5: Update Your Code**

1. Open `d:/eplacement/js/email-service.js`
2. Replace these lines (lines 6-8):

```javascript
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY_HERE';  // Paste your Public Key
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID_HERE';  // Paste your Service ID
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID_HERE'; // Paste your Template ID
```

3. Save the file

### **Step 6: Add EmailJS Script to HTML**

Add this line to your HTML files (before closing `</body>` tag):

**In `faculty-dashboard.html`** (before `<script type="module" src="js/faculty-dashboard.js"></script>`):

```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
```

### **Step 7: Test**

1. Login as faculty
2. Post a new placement
3. Check if students receive emails
4. Check EmailJS dashboard for sent emails

---

## 🔧 **Alternative Method: Firebase Cloud Functions (Advanced)**

This requires Firebase Blaze (pay-as-you-go) plan.

### **Prerequisites**
- Firebase Blaze plan
- Node.js installed
- Firebase CLI installed

### **Setup Steps**

1. **Upgrade to Blaze Plan**:
   ```bash
   # In Firebase Console, upgrade your project to Blaze plan
   ```

2. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

3. **Login to Firebase**:
   ```bash
   firebase login
   ```

4. **Initialize Functions**:
   ```bash
   cd d:/eplacement
   firebase init functions
   ```
   - Select your project
   - Choose JavaScript
   - Install dependencies: Yes

5. **Install Dependencies**:
   ```bash
   cd functions
   npm install nodemailer
   ```

6. **Update `functions/index.js`**:
   - Already created at `d:/eplacement/functions/index.js`
   - Update email credentials (lines 11-14)

7. **Deploy Functions**:
   ```bash
   firebase deploy --only functions
   ```

8. **Configure Email**:
   - For Gmail: Enable "App Passwords" in Google Account
   - Or use SendGrid, Mailgun, etc.

---

## 📧 **Email Service Options Comparison**

| Service | Cost | Ease of Setup | Monthly Limit | Best For |
|---------|------|---------------|---------------|----------|
| **EmailJS** | Free | ⭐⭐⭐⭐⭐ Easy | 200 emails | Small projects, testing |
| **Firebase + Gmail** | Pay-as-you-go | ⭐⭐⭐ Medium | Depends on usage | Production |
| **SendGrid** | Free tier available | ⭐⭐⭐⭐ Easy | 100/day free | Production |
| **Mailgun** | Free tier available | ⭐⭐⭐ Medium | 5,000/month free | Production |

---

## 🎯 **Quick Start (EmailJS - Recommended)**

### **5-Minute Setup**

1. **Sign up**: https://www.emailjs.com/
2. **Add Gmail service**: Get Service ID
3. **Create template**: Get Template ID
4. **Get Public Key**: From Account settings
5. **Update code**: Edit `js/email-service.js` lines 6-8
6. **Add script**: Add EmailJS CDN to `faculty-dashboard.html`
7. **Test**: Post a placement and check emails!

---

## 🔍 **Troubleshooting**

### **Emails Not Sending**

1. **Check EmailJS Dashboard**:
   - Go to EmailJS → Email History
   - Check for errors

2. **Check Browser Console**:
   - Press F12
   - Look for errors in Console tab

3. **Verify Configuration**:
   - Public Key is correct
   - Service ID is correct
   - Template ID is correct

4. **Check Spam Folder**:
   - Emails might be in spam
   - Mark as "Not Spam"

### **EmailJS Errors**

**Error: "Service ID is invalid"**
- Solution: Double-check Service ID in EmailJS dashboard

**Error: "Template ID is invalid"**
- Solution: Verify Template ID matches

**Error: "Public Key is invalid"**
- Solution: Copy Public Key from Account settings

### **Gmail Issues**

**Error: "Less secure app access"**
- Solution: Use App Password instead
- Go to Google Account → Security → App Passwords

---

## 📝 **Testing Checklist**

- [ ] EmailJS account created
- [ ] Email service connected (Gmail/Outlook)
- [ ] Email template created with all variables
- [ ] Public Key, Service ID, Template ID copied
- [ ] `email-service.js` updated with credentials
- [ ] EmailJS script added to `faculty-dashboard.html`
- [ ] Test placement posted
- [ ] Email received by student
- [ ] Email contains correct information
- [ ] Links in email work correctly

---

## 🚀 **Production Recommendations**

For production use:

1. **Use Professional Email Service**:
   - SendGrid (reliable, good free tier)
   - Mailgun (developer-friendly)
   - AWS SES (cheap, scalable)

2. **Use Firebase Cloud Functions**:
   - More secure
   - Better for high volume
   - Professional setup

3. **Add Email Queue**:
   - Prevent rate limiting
   - Retry failed emails
   - Track delivery status

4. **Monitor Email Delivery**:
   - Track open rates
   - Monitor bounce rates
   - Check spam reports

---

## 💡 **Tips**

1. **Test with Your Own Email First**
2. **Don't Spam**: Respect email limits
3. **Personalize Emails**: Use student names
4. **Mobile-Friendly**: Test on mobile devices
5. **Unsubscribe Option**: Add for production
6. **Track Metrics**: Monitor email performance

---

## 📞 **Support**

- **EmailJS Docs**: https://www.emailjs.com/docs/
- **Firebase Functions**: https://firebase.google.com/docs/functions
- **Nodemailer**: https://nodemailer.com/

---

**Note**: For this project, EmailJS is the easiest and fastest way to get email notifications working!
