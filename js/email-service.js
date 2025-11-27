// Email Service using EmailJS (Free alternative to Cloud Functions)
// Sign up at https://www.emailjs.com/ to get your credentials

// EmailJS Configuration
const EMAILJS_PUBLIC_KEY = 'pNLBGe35BenjGzzqO'; // Get from EmailJS dashboard
const EMAILJS_SERVICE_ID = 'service_vmklq15';         // Get from EmailJS dashboard
const EMAILJS_TEMPLATE_ID = 'template_bivlyj9';       // Get from EmailJS dashboard

// Initialize EmailJS
(function() {
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }
})();

/**
 * Send placement notification email to a student
 * @param {Object} studentData - Student information
 * @param {Object} placementData - Placement information
 */
export async function sendPlacementEmail(studentData, placementData) {
    try {
        // Check if EmailJS is loaded
        if (typeof emailjs === 'undefined') {
            console.warn('EmailJS not loaded. Email notification skipped.');
            return false;
        }

        const templateParams = {
            to_email: studentData.email,
            to_name: studentData.fullName,
            company_name: placementData.companyName,
            job_role: placementData.jobRole,
            package: placementData.package,
            location: placementData.location,
            deadline: new Date(placementData.deadline).toLocaleDateString(),
            job_description: placementData.jobDescription,
            requirements: placementData.requirements || 'Not specified',
            application_link: placementData.applicationLink,
            portal_link: window.location.origin + '/login.html'
        };

        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams
        );

        console.log('Email sent successfully:', response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

/**
 * Send bulk emails to multiple students
 * @param {Array} students - Array of student objects
 * @param {Object} placementData - Placement information
 */
export async function sendBulkPlacementEmails(students, placementData) {
    const results = [];
    
    for (const student of students) {
        try {
            const sent = await sendPlacementEmail(student, placementData);
            results.push({ email: student.email, sent });
            
            // Add delay to avoid rate limiting (EmailJS free tier has limits)
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`Failed to send email to ${student.email}:`, error);
            results.push({ email: student.email, sent: false, error: error.message });
        }
    }
    
    return results;
}

/**
 * Alternative: Simple mailto link (opens user's email client)
 * Use this as fallback if EmailJS is not configured
 */
export function createMailtoLink(studentEmail, placementData) {
    const subject = encodeURIComponent(`New Placement: ${placementData.companyName} - ${placementData.jobRole}`);
    const body = encodeURIComponent(`
Dear Student,

A new placement opportunity has been posted:

Company: ${placementData.companyName}
Position: ${placementData.jobRole}
Package: ${placementData.package} LPA
Location: ${placementData.location}
Deadline: ${new Date(placementData.deadline).toLocaleDateString()}

Job Description:
${placementData.jobDescription}

Application Link: ${placementData.applicationLink}

Login to the E-Placement Portal to view full details and apply.

Best regards,
E-Placement Portal Team
    `);
    
    return `mailto:${studentEmail}?subject=${subject}&body=${body}`;
}
