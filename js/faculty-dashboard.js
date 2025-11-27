import { auth, db, storage } from './firebase-config.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, orderBy, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { sendPlacementEmail } from './email-service.js';

let currentUser = null;
let allStudents = [];
let allForms = [];
let allPlacements = [];

// Check authentication
window.addEventListener('DOMContentLoaded', async () => {
    const userId = sessionStorage.getItem('userId');
    const userRole = sessionStorage.getItem('userRole');
    
    if (!userId || userRole !== 'faculty') {
        window.location.href = 'login.html';
        return;
    }
    
    await loadUserData(userId);
    await loadStudents();
    await loadPosts();
    await loadAllForms();
});

async function loadUserData(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            currentUser = { id: userId, ...userDoc.data() };
            displayUserProfile(currentUser);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

function displayUserProfile(user) {
    document.getElementById('facultyName').textContent = user.fullName;
    document.getElementById('profileName').textContent = user.fullName;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileFacultyId').textContent = user.facultyId;
    document.getElementById('profilePhone').textContent = user.phone;
    document.getElementById('profileDepartment').textContent = user.department;
    
    // Set initials
    const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('profileInitials').textContent = initials;
    
    // Pre-fill update form
    document.getElementById('updateName').value = user.fullName;
    document.getElementById('updatePhone').value = user.phone;
    document.getElementById('updateDepartment').value = user.department;
}

window.postPlacement = async function(event) {
    event.preventDefault();
    
    const postMessage = document.getElementById('postMessage');
    
    try {
        const selectedOptions = Array.from(document.getElementById('eligibleDepartments').selectedOptions);
        const eligibleDepartments = selectedOptions.map(option => option.value);
        
        const placementData = {
            companyName: document.getElementById('companyName').value,
            jobRole: document.getElementById('jobRole').value,
            package: document.getElementById('package').value,
            location: document.getElementById('location').value,
            deadline: document.getElementById('deadline').value,
            eligibleDepartments: eligibleDepartments,
            jobDescription: document.getElementById('jobDescription').value,
            requirements: document.getElementById('requirements').value,
            applicationLink: document.getElementById('applicationLink').value,
            postedBy: currentUser.id,
            postedByName: currentUser.fullName,
            postedAt: new Date().toISOString()
        };
        
        const docRef = await addDoc(collection(db, 'placements'), placementData);
        
        // Send email notifications to eligible students
        postMessage.textContent = 'Placement posted! Sending email notifications...';
        postMessage.className = 'mb-4 p-3 bg-blue-100 text-blue-700 rounded-lg';
        postMessage.classList.remove('hidden');
        
        const emailResults = await sendPlacementNotifications(placementData, docRef.id);
        
        postMessage.textContent = `Placement posted successfully! Emails sent: ${emailResults.sent}, Failed: ${emailResults.failed}`;
        postMessage.className = 'mb-4 p-3 bg-green-100 text-green-700 rounded-lg';
        postMessage.classList.remove('hidden');
        
        document.getElementById('postPlacementForm').reset();
        
        setTimeout(() => {
            postMessage.classList.add('hidden');
        }, 3000);
        
        await loadPosts();
    } catch (error) {
        console.error('Error posting placement:', error);
        postMessage.textContent = 'Error posting placement. Please try again.';
        postMessage.className = 'mb-4 p-3 bg-red-100 text-red-700 rounded-lg';
        postMessage.classList.remove('hidden');
    }
};

async function sendPlacementNotifications(placementData, placementId) {
    try {
        console.log('=== Starting Email Notifications ===');
        console.log('Placement:', placementData.companyName);
        console.log('Eligible Departments:', placementData.eligibleDepartments);
        
        // Get all students
        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const studentsSnapshot = await getDocs(studentsQuery);
        
        console.log('Total students found:', studentsSnapshot.size);
        
        const eligibleDepts = placementData.eligibleDepartments;
        let emailsSent = 0;
        let emailsFailed = 0;
        let studentsProcessed = 0;
        
        for (const studentDoc of studentsSnapshot.docs) {
            const student = studentDoc.data();
            studentsProcessed++;
            
            console.log(`Student ${studentsProcessed}: ${student.fullName} (${student.department})`);
            
            // Check if student is eligible
            const isEligible = eligibleDepts.includes('All') || eligibleDepts.includes(student.department);
            console.log('  - Eligible:', isEligible);
            
            if (isEligible) {
                // Create notification record in database
                await addDoc(collection(db, 'notifications'), {
                    userId: studentDoc.id,
                    userEmail: student.email,
                    type: 'placement',
                    placementId: placementId,
                    companyName: placementData.companyName,
                    jobRole: placementData.jobRole,
                    message: `New placement opportunity: ${placementData.companyName} - ${placementData.jobRole}`,
                    sentAt: new Date().toISOString(),
                    read: false
                });
                
                // Send actual email using EmailJS
                console.log('  - Attempting to send email to:', student.email);
                try {
                    const emailSent = await sendPlacementEmail(student, placementData);
                    if (emailSent) {
                        emailsSent++;
                        console.log(`  ✓ Email sent successfully to: ${student.email}`);
                    } else {
                        emailsFailed++;
                        console.warn(`  ✗ Email failed for: ${student.email} (returned false)`);
                    }
                    
                    // Add small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (emailError) {
                    emailsFailed++;
                    console.error(`  ✗ Error sending email to ${student.email}:`, emailError);
                    console.error('  Error details:', emailError.message);
                }
            } else {
                console.log('  - Skipped (not eligible for this placement)');
            }
        }
        
        console.log('=== Email Notifications Complete ===');
        console.log(`Total students processed: ${studentsProcessed}`);
        console.log(`Emails sent: ${emailsSent}, Failed: ${emailsFailed}`);
        return { sent: emailsSent, failed: emailsFailed };
    } catch (error) {
        console.error('Error sending notifications:', error);
        return { sent: 0, failed: 0 };
    }
}

async function loadPosts() {
    try {
        const placementsQuery = query(collection(db, 'placements'), orderBy('postedAt', 'desc'));
        const querySnapshot = await getDocs(placementsQuery);
        const postsList = document.getElementById('postsList');
        
        if (querySnapshot.empty) {
            postsList.innerHTML = '<p class="text-gray-600">No placements posted yet.</p>';
            return;
        }
        
        postsList.innerHTML = '';
        allPlacements = [];
        
        querySnapshot.forEach((doc) => {
            const placement = { id: doc.id, ...doc.data() };
            allPlacements.push(placement);
            
            const deadline = new Date(placement.deadline);
            const now = new Date();
            const isExpired = deadline < now;
            
            const postCard = document.createElement('div');
            postCard.className = 'bg-white rounded-lg shadow-lg p-6';
            postCard.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">${placement.companyName}</h3>
                        <p class="text-purple-600 font-semibold">${placement.jobRole}</p>
                        <p class="text-sm text-gray-500 mt-2">Posted: ${new Date(placement.postedAt).toLocaleString()}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        ${isExpired ? '<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">Expired</span>' : '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">Active</span>'}
                        <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">${placement.package} LPA</span>
                    </div>
                </div>
                <div class="mb-4">
                    <p class="text-gray-700"><strong>Location:</strong> ${placement.location}</p>
                    <p class="text-gray-700"><strong>Deadline:</strong> ${deadline.toLocaleString()}</p>
                    <p class="text-gray-700"><strong>Eligible Departments:</strong> ${placement.eligibleDepartments.join(', ')}</p>
                </div>
                <div class="flex space-x-2">
                    <button onclick="editPlacement('${doc.id}')" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                        <i class="fas fa-edit mr-2"></i>Edit
                    </button>
                    <button onclick="deletePlacement('${doc.id}')" class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
                        <i class="fas fa-trash mr-2"></i>Delete
                    </button>
                </div>
            `;
            postsList.appendChild(postCard);
        });
        
        // Auto-delete expired placements
        await autoDeleteExpiredPlacements();
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

async function autoDeleteExpiredPlacements() {
    const now = new Date();
    
    for (const placement of allPlacements) {
        const deadline = new Date(placement.deadline);
        if (deadline < now) {
            try {
                await deleteDoc(doc(db, 'placements', placement.id));
                console.log(`Auto-deleted expired placement: ${placement.companyName}`);
            } catch (error) {
                console.error('Error auto-deleting placement:', error);
            }
        }
    }
}

window.editPlacement = function(placementId) {
    const placement = allPlacements.find(p => p.id === placementId);
    if (!placement) return;
    
    document.getElementById('editPlacementId').value = placementId;
    document.getElementById('editCompanyName').value = placement.companyName;
    document.getElementById('editJobRole').value = placement.jobRole;
    document.getElementById('editPackage').value = placement.package;
    document.getElementById('editLocation').value = placement.location;
    document.getElementById('editDeadline').value = placement.deadline;
    document.getElementById('editJobDescription').value = placement.jobDescription;
    document.getElementById('editApplicationLink').value = placement.applicationLink;
    
    document.getElementById('editPlacementModal').classList.remove('hidden');
    document.getElementById('editPlacementModal').classList.add('flex');
};

window.closeEditModal = function() {
    document.getElementById('editPlacementModal').classList.add('hidden');
    document.getElementById('editPlacementModal').classList.remove('flex');
};

window.updatePlacement = async function(event) {
    event.preventDefault();
    
    const placementId = document.getElementById('editPlacementId').value;
    
    try {
        const updatedData = {
            companyName: document.getElementById('editCompanyName').value,
            jobRole: document.getElementById('editJobRole').value,
            package: document.getElementById('editPackage').value,
            location: document.getElementById('editLocation').value,
            deadline: document.getElementById('editDeadline').value,
            jobDescription: document.getElementById('editJobDescription').value,
            applicationLink: document.getElementById('editApplicationLink').value
        };
        
        await updateDoc(doc(db, 'placements', placementId), updatedData);
        
        alert('Placement updated successfully!');
        closeEditModal();
        await loadPosts();
    } catch (error) {
        console.error('Error updating placement:', error);
        alert('Error updating placement. Please try again.');
    }
};

window.deletePlacement = async function(placementId) {
    if (!confirm('Are you sure you want to delete this placement?')) {
        return;
    }
    
    try {
        await deleteDoc(doc(db, 'placements', placementId));
        alert('Placement deleted successfully!');
        await loadPosts();
    } catch (error) {
        console.error('Error deleting placement:', error);
        alert('Error deleting placement. Please try again.');
    }
};

async function loadStudents() {
    const studentsList = document.getElementById('studentsList');
    
    try {
        // Simple query without orderBy to avoid index requirement
        const studentsQuery = query(
            collection(db, 'users'), 
            where('role', '==', 'student')
        );
        const querySnapshot = await getDocs(studentsQuery);
        
        if (querySnapshot.empty) {
            studentsList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-users text-gray-400 text-5xl mb-4"></i>
                    <p class="text-gray-600 text-lg">No students registered yet.</p>
                    <p class="text-gray-500 text-sm mt-2">Students will appear here once they register.</p>
                </div>
            `;
            return;
        }
        
        // Convert to array and sort by name (client-side sorting)
        allStudents = [];
        querySnapshot.forEach((doc) => {
            allStudents.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort alphabetically by full name
        allStudents.sort((a, b) => {
            const nameA = (a.fullName || '').toLowerCase();
            const nameB = (b.fullName || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        studentsList.innerHTML = '';
        
        allStudents.forEach((student) => {
            const studentCard = document.createElement('div');
            studentCard.className = 'bg-gray-50 border border-gray-200 p-4 rounded-lg hover:shadow-md transition student-card';
            studentCard.setAttribute('data-student-name', student.fullName.toLowerCase());
            studentCard.setAttribute('data-student-email', student.email.toLowerCase());
            studentCard.setAttribute('data-student-dept', student.department.toLowerCase());
            
            studentCard.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <div class="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                ${student.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                            </div>
                            <div>
                                <h4 class="font-bold text-gray-800 text-lg">${student.fullName}</h4>
                                <p class="text-sm text-gray-500">${student.studentId || 'N/A'}</p>
                            </div>
                        </div>
                        <div class="ml-15 space-y-1">
                            <p class="text-sm text-gray-600">
                                <i class="fas fa-envelope w-4 text-purple-600"></i> ${student.email}
                            </p>
                            <p class="text-sm text-gray-600">
                                <i class="fas fa-phone w-4 text-purple-600"></i> ${student.phone || 'N/A'}
                            </p>
                            <p class="text-sm text-gray-600">
                                <i class="fas fa-graduation-cap w-4 text-purple-600"></i> ${student.department} - Year ${student.year}
                            </p>
                            <p class="text-sm ${student.resumeUrl ? 'text-green-600' : 'text-gray-400'}">
                                <i class="fas fa-file-pdf w-4"></i> ${student.resumeUrl ? 'Resume Uploaded' : 'No Resume'}
                            </p>
                        </div>
                    </div>
                    <div class="flex flex-col space-y-2">
                        <button onclick="viewStudentProfile('${student.id}')" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm">
                            <i class="fas fa-eye mr-2"></i>View Profile
                        </button>
                        ${student.resumeUrl ? `
                            <a href="${student.resumeUrl}" target="_blank" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm text-center">
                                <i class="fas fa-file-pdf mr-2"></i>View Resume
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
            studentsList.appendChild(studentCard);
        });
        
        // Show count
        const countDiv = document.createElement('div');
        countDiv.className = 'mt-4 text-center text-gray-600 text-sm';
        countDiv.innerHTML = `<strong>${allStudents.length}</strong> student${allStudents.length !== 1 ? 's' : ''} registered`;
        studentsList.appendChild(countDiv);
        
    } catch (error) {
        console.error('Error loading students:', error);
        console.error('Error details:', error.message);
        
        studentsList.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-3"></i>
                <p class="text-red-700 font-semibold mb-2">⚠️ Error loading students</p>
                <p class="text-red-600 text-sm mb-3">${error.message}</p>
                <p class="text-gray-600 text-sm mb-4">Possible causes:</p>
                <ul class="text-gray-600 text-sm list-disc inline-block text-left mb-4">
                    <li>No students have registered yet</li>
                    <li>Firestore rules need to be updated</li>
                    <li>Network connection issue</li>
                </ul>
                <br>
                <button onclick="loadStudents()" class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition">
                    <i class="fas fa-sync mr-2"></i>Retry
                </button>
            </div>
        `;
    }
}

window.searchStudents = function() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase().trim();
    const studentCards = document.querySelectorAll('.student-card');
    let visibleCount = 0;
    
    studentCards.forEach(card => {
        const name = card.getAttribute('data-student-name') || '';
        const email = card.getAttribute('data-student-email') || '';
        const dept = card.getAttribute('data-student-dept') || '';
        
        // Search in name, email, and department
        if (name.includes(searchTerm) || email.includes(searchTerm) || dept.includes(searchTerm)) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show/hide "no results" message
    const existingNoResults = document.getElementById('noStudentsFound');
    if (existingNoResults) {
        existingNoResults.remove();
    }
    
    if (visibleCount === 0 && searchTerm !== '') {
        const studentsList = document.getElementById('studentsList');
        const noResultsDiv = document.createElement('div');
        noResultsDiv.id = 'noStudentsFound';
        noResultsDiv.className = 'text-center py-8 text-gray-500';
        noResultsDiv.innerHTML = `
            <i class="fas fa-search text-4xl mb-3"></i>
            <p class="text-lg">No students found matching "${searchTerm}"</p>
            <p class="text-sm mt-2">Try searching by name, email, or department</p>
        `;
        studentsList.appendChild(noResultsDiv);
    }
};

window.viewStudentProfile = async function(studentId) {
    try {
        const studentDoc = await getDoc(doc(db, 'users', studentId));
        if (!studentDoc.exists()) return;
        
        const student = studentDoc.data();
        const content = document.getElementById('studentProfileContent');
        
        content.innerHTML = `
            <div class="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label class="block text-gray-600 font-semibold mb-1">Full Name</label>
                    <p class="text-gray-800">${student.fullName}</p>
                </div>
                <div>
                    <label class="block text-gray-600 font-semibold mb-1">Email</label>
                    <p class="text-gray-800">${student.email}</p>
                </div>
                <div>
                    <label class="block text-gray-600 font-semibold mb-1">Student ID</label>
                    <p class="text-gray-800">${student.studentId}</p>
                </div>
                <div>
                    <label class="block text-gray-600 font-semibold mb-1">Phone</label>
                    <p class="text-gray-800">${student.phone}</p>
                </div>
                <div>
                    <label class="block text-gray-600 font-semibold mb-1">Department</label>
                    <p class="text-gray-800">${student.department}</p>
                </div>
                <div>
                    <label class="block text-gray-600 font-semibold mb-1">Year</label>
                    <p class="text-gray-800">Year ${student.year}</p>
                </div>
            </div>
            
            <div class="border-t pt-6">
                <h4 class="text-xl font-bold mb-4 text-gray-800">Resume</h4>
                ${student.resumeUrl ? `
                    <a href="${student.resumeUrl}" target="_blank" class="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition">
                        <i class="fas fa-file-pdf mr-2"></i>View Resume
                    </a>
                ` : '<p class="text-gray-600">No resume uploaded</p>'}
            </div>
            
            <div class="border-t pt-6 mt-6">
                <h4 class="text-xl font-bold mb-4 text-gray-800">Application History</h4>
                <div id="studentApplications">Loading...</div>
            </div>
        `;
        
        document.getElementById('studentProfileModal').classList.remove('hidden');
        document.getElementById('studentProfileModal').classList.add('flex');
        
        // Load student's applications
        loadStudentApplications(studentId);
    } catch (error) {
        console.error('Error viewing student profile:', error);
    }
};

async function loadStudentApplications(studentId) {
    const container = document.getElementById('studentApplications');
    
    try {
        // Simple query without orderBy to avoid index requirement
        const formsQuery = query(
            collection(db, 'applicationForms'),
            where('studentId', '==', studentId)
        );
        const querySnapshot = await getDocs(formsQuery);
        
        if (querySnapshot.empty) {
            container.innerHTML = '<p class="text-gray-600">No applications submitted yet.</p>';
            return;
        }
        
        // Convert to array and sort by date (client-side sorting)
        const forms = [];
        querySnapshot.forEach((doc) => {
            forms.push(doc.data());
        });
        
        // Sort by submittedAt in descending order (newest first)
        forms.sort((a, b) => {
            const dateA = new Date(a.submittedAt);
            const dateB = new Date(b.submittedAt);
            return dateB - dateA;
        });
        
        container.innerHTML = '';
        forms.forEach((form) => {
            const formCard = document.createElement('div');
            formCard.className = 'bg-gray-50 p-4 rounded-lg mb-2 border border-gray-200';
            formCard.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <p class="font-semibold text-gray-800">${form.companyName}</p>
                        <p class="text-sm text-gray-600">${form.position}</p>
                        <p class="text-xs text-gray-500 mt-1">
                            <i class="fas fa-calendar mr-1"></i>${new Date(form.submittedAt).toLocaleString()}
                        </p>
                    </div>
                    <span class="text-sm font-semibold px-3 py-1 rounded-full ${
                        form.applicationStatus === 'Selected' ? 'bg-green-100 text-green-800' :
                        form.applicationStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                        form.applicationStatus === 'Interview Scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                    }">${form.applicationStatus}</span>
                </div>
            `;
            container.appendChild(formCard);
        });
    } catch (error) {
        console.error('Error loading student applications:', error);
        container.innerHTML = '<p class="text-red-600">Error loading applications.</p>';
    }
}

window.closeStudentModal = function() {
    document.getElementById('studentProfileModal').classList.add('hidden');
    document.getElementById('studentProfileModal').classList.remove('flex');
};

async function loadAllForms() {
    try {
        const formsQuery = query(collection(db, 'applicationForms'), orderBy('submittedAt', 'desc'));
        const querySnapshot = await getDocs(formsQuery);
        const formsList = document.getElementById('applicationFormsList');
        const companyFilter = document.getElementById('companyFilter');
        
        if (querySnapshot.empty) {
            formsList.innerHTML = '<p class="text-gray-600">No application forms submitted yet.</p>';
            return;
        }
        
        allForms = [];
        const companies = new Set();
        
        querySnapshot.forEach((doc) => {
            const form = { id: doc.id, ...doc.data() };
            allForms.push(form);
            companies.add(form.companyName);
        });
        
        // Populate company filter
        companyFilter.innerHTML = '<option value="">All Companies</option>';
        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company;
            option.textContent = company;
            companyFilter.appendChild(option);
        });
        
        displayForms(allForms);
    } catch (error) {
        console.error('Error loading forms:', error);
    }
}

function displayForms(forms) {
    const formsList = document.getElementById('applicationFormsList');
    formsList.innerHTML = '';
    
    // Group forms by student
    const studentGroups = {};
    forms.forEach(form => {
        if (!studentGroups[form.studentId]) {
            studentGroups[form.studentId] = {
                studentName: form.studentName,
                studentEmail: form.studentEmail,
                department: form.department,
                year: form.year,
                applications: []
            };
        }
        studentGroups[form.studentId].applications.push(form);
    });
    
    // Display grouped forms
    Object.keys(studentGroups).forEach(studentId => {
        const group = studentGroups[studentId];
        const studentCard = document.createElement('div');
        studentCard.className = 'bg-white rounded-lg shadow-lg p-6 mb-6';
        
        let applicationsHTML = '';
        group.applications.forEach(form => {
            const eligibilityStatus = form.eligibilityStatus || '';
            const interviewStatus = form.interviewStatus || '';
            const facultyNotes = form.facultyNotes || '';
            
            applicationsHTML += `
                <div class="border-t pt-4 mt-4">
                    <div class="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <h4 class="font-bold text-lg text-gray-800">${form.companyName}</h4>
                            <p class="text-gray-600">${form.position}</p>
                            <p class="text-sm text-gray-500 mt-1">
                                Applied: ${new Date(form.submittedAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div class="text-right">
                            <span class="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                                ${form.applicationStatus || 'Applied'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-4 mb-4">
                        <!-- Eligibility Status -->
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2 text-sm">Eligibility Status:</label>
                            <div class="flex gap-2">
                                <button onclick="updateEligibility('${form.id}', 'eligible')" 
                                    class="px-4 py-2 rounded-lg font-semibold text-sm transition ${eligibilityStatus === 'eligible' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-green-100'}">
                                    <i class="fas fa-check mr-1"></i>Eligible
                                </button>
                                <button onclick="updateEligibility('${form.id}', 'not-eligible')" 
                                    class="px-4 py-2 rounded-lg font-semibold text-sm transition ${eligibilityStatus === 'not-eligible' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-red-100'}">
                                    <i class="fas fa-times mr-1"></i>Not Eligible
                                </button>
                            </div>
                        </div>
                        
                        <!-- Interview Status -->
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2 text-sm">Interview Status:</label>
                            <div class="flex gap-2">
                                <button onclick="updateInterviewStatus('${form.id}', 'selected')" 
                                    class="px-4 py-2 rounded-lg font-semibold text-sm transition ${interviewStatus === 'selected' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}">
                                    <i class="fas fa-user-check mr-1"></i>Selected
                                </button>
                                <button onclick="updateInterviewStatus('${form.id}', 'rejected')" 
                                    class="px-4 py-2 rounded-lg font-semibold text-sm transition ${interviewStatus === 'rejected' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
                                    <i class="fas fa-user-times mr-1"></i>Not Selected
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Faculty Notes -->
                    <div class="mb-2">
                        <label class="block text-gray-700 font-semibold mb-2 text-sm">
                            <i class="fas fa-comment-alt mr-1"></i>Notes & Feedback for Student:
                        </label>
                        <textarea id="notes-${form.id}" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" 
                            rows="3" 
                            placeholder="Add feedback about resume improvements, eligibility criteria, or interview performance...">${facultyNotes}</textarea>
                        <button onclick="updateNotes('${form.id}')" 
                            class="mt-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm">
                            <i class="fas fa-save mr-2"></i>Save Notes
                        </button>
                    </div>
                </div>
            `;
        });
        
        studentCard.innerHTML = `
            <div class="flex items-start justify-between mb-4 pb-4 border-b-2 border-purple-200">
                <div class="flex items-center">
                    <div class="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                        ${group.studentName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold text-gray-800">${group.studentName}</h3>
                        <p class="text-gray-600">${group.studentEmail}</p>
                        <p class="text-sm text-gray-500">${group.department} - Year ${group.year}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-bold">
                        ${group.applications.length} Application${group.applications.length > 1 ? 's' : ''}
                    </span>
                </div>
            </div>
            
            <div class="applications-list">
                ${applicationsHTML}
            </div>
        `;
        
        formsList.appendChild(studentCard);
    });
    
    if (Object.keys(studentGroups).length === 0) {
        formsList.innerHTML = '<p class="text-gray-600 text-center py-8">No application forms found.</p>';
    }
}

window.searchForms = function() {
    const searchTerm = document.getElementById('formSearch').value.toLowerCase();
    const companyFilter = document.getElementById('companyFilter').value;
    
    let filtered = allForms;
    
    if (searchTerm) {
        filtered = filtered.filter(form => 
            form.studentName.toLowerCase().includes(searchTerm) ||
            form.companyName.toLowerCase().includes(searchTerm) ||
            form.position.toLowerCase().includes(searchTerm)
        );
    }
    
    if (companyFilter) {
        filtered = filtered.filter(form => form.companyName === companyFilter);
    }
    
    displayForms(filtered);
};

window.filterForms = function() {
    searchForms();
};

window.updateProfile = async function(event) {
    event.preventDefault();
    
    const updateMessage = document.getElementById('updateMessage');
    
    try {
        const updatedData = {
            fullName: document.getElementById('updateName').value,
            phone: document.getElementById('updatePhone').value,
            department: document.getElementById('updateDepartment').value
        };
        
        await updateDoc(doc(db, 'users', currentUser.id), updatedData);
        
        currentUser = { ...currentUser, ...updatedData };
        displayUserProfile(currentUser);
        
        updateMessage.textContent = 'Profile updated successfully!';
        updateMessage.className = 'mb-4 p-3 bg-green-100 text-green-700 rounded-lg';
        updateMessage.classList.remove('hidden');
        
        setTimeout(() => {
            updateMessage.classList.add('hidden');
        }, 3000);
    } catch (error) {
        console.error('Error updating profile:', error);
        updateMessage.textContent = 'Error updating profile. Please try again.';
        updateMessage.className = 'mb-4 p-3 bg-red-100 text-red-700 rounded-lg';
        updateMessage.classList.remove('hidden');
    }
};

window.showSection = function(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('aside a').forEach(link => {
        link.classList.remove('sidebar-active');
    });
    
    // Show selected section
    document.getElementById(`${sectionName}-section`).classList.remove('hidden');
    
    // Add active class to selected nav item
    document.getElementById(`nav-${sectionName}`).classList.add('sidebar-active');
};

window.updateEligibility = async function(formId, status) {
    try {
        await updateDoc(doc(db, 'applicationForms', formId), {
            eligibilityStatus: status,
            facultyUpdatedAt: new Date().toISOString()
        });
        
        // Update local data and refresh display
        const formIndex = allForms.findIndex(f => f.id === formId);
        if (formIndex !== -1) {
            allForms[formIndex].eligibilityStatus = status;
        }
        
        // Refresh the filtered display
        searchForms();
        
        // Show success message
        alert(`Eligibility status updated to: ${status === 'eligible' ? 'Eligible' : 'Not Eligible'}`);
    } catch (error) {
        console.error('Error updating eligibility:', error);
        alert('Error updating eligibility status. Please try again.');
    }
};

window.updateInterviewStatus = async function(formId, status) {
    try {
        await updateDoc(doc(db, 'applicationForms', formId), {
            interviewStatus: status,
            facultyUpdatedAt: new Date().toISOString()
        });
        
        // Update local data and refresh display
        const formIndex = allForms.findIndex(f => f.id === formId);
        if (formIndex !== -1) {
            allForms[formIndex].interviewStatus = status;
        }
        
        // Refresh the filtered display
        searchForms();
        
        // Show success message
        const statusText = status === 'selected' ? 'Selected' : status === 'rejected' ? 'Not Selected' : status;
        alert(`Interview status updated to: ${statusText}`);
    } catch (error) {
        console.error('Error updating interview status:', error);
        alert('Error updating interview status. Please try again.');
    }
};

window.updateNotes = async function(formId) {
    const notesTextarea = document.getElementById(`notes-${formId}`);
    const notes = notesTextarea.value;
    
    try {
        await updateDoc(doc(db, 'applicationForms', formId), {
            facultyNotes: notes,
            facultyUpdatedAt: new Date().toISOString()
        });
        
        // Update local data
        const formIndex = allForms.findIndex(f => f.id === formId);
        if (formIndex !== -1) {
            allForms[formIndex].facultyNotes = notes;
        }
        
        alert('Notes saved successfully! Student will be able to see this feedback in their Application Status section.');
    } catch (error) {
        console.error('Error updating notes:', error);
        alert('Error saving notes. Please try again.');
    }
};

window.logout = async function() {
    try {
        await signOut(auth);
        sessionStorage.clear();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
};
