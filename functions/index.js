// Firebase Cloud Functions for Email Notifications
// This requires Firebase Blaze (Pay-as-you-go) plan

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configure your email service
// For Gmail: Enable "Less secure app access" or use App Password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // Replace with your email
        pass: 'your-app-password'      // Replace with your app password
    }
});

// Alternative: Using SendGrid
// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey('YOUR_SENDGRID_API_KEY');

// Trigger when a new notification is created
exports.sendPlacementNotification = functions.firestore
    .document('notifications/{notificationId}')
    .onCreate(async (snap, context) => {
        const notification = snap.data();
        
        try {
            const mailOptions = {
                from: 'E-Placement Portal <your-email@gmail.com>',
                to: notification.userEmail,
                subject: `🎯 New Placement: ${notification.companyName} - ${notification.jobRole}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🎓 New Placement Opportunity!</h1>
                            </div>
                            <div class="content">
                                <h2>Hello!</h2>
                                <p>A new placement opportunity has been posted that matches your profile:</p>
                                
                                <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
                                    <h3 style="margin-top: 0; color: #667eea;">${notification.companyName}</h3>
                                    <p><strong>Position:</strong> ${notification.jobRole}</p>
                                    <p><strong>Message:</strong> ${notification.message}</p>
                                </div>
                                
                                <p>Login to the E-Placement Portal to view full details and apply:</p>
                                <a href="https://your-portal-url.web.app/login.html" class="button">View Placement Details</a>
                                
                                <p style="margin-top: 30px; font-size: 14px; color: #666;">
                                    Don't miss this opportunity! Make sure to apply before the deadline.
                                </p>
                            </div>
                            <div class="footer">
                                <p>© 2025 E-Placement Portal. All rights reserved.</p>
                                <p>This is an automated email. Please do not reply.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };
            
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully to:', notification.userEmail);
            
            // Update notification status
            await snap.ref.update({ emailSent: true, sentAt: admin.firestore.FieldValue.serverTimestamp() });
            
        } catch (error) {
            console.error('Error sending email:', error);
            await snap.ref.update({ emailSent: false, error: error.message });
        }
    });

// Alternative function using SendGrid
/*
exports.sendPlacementNotificationSendGrid = functions.firestore
    .document('notifications/{notificationId}')
    .onCreate(async (snap, context) => {
        const notification = snap.data();
        
        const msg = {
            to: notification.userEmail,
            from: 'your-verified-sender@yourdomain.com',
            subject: `New Placement: ${notification.companyName}`,
            html: `<strong>${notification.message}</strong>`
        };
        
        try {
            await sgMail.send(msg);
            console.log('Email sent via SendGrid');
        } catch (error) {
            console.error('SendGrid error:', error);
        }
    });
*/
