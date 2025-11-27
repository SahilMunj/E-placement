import { auth, db, storage } from './firebase-config.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

let currentUser = null;
let currentPlacementId = null;

// Check authentication
window.addEventListener('DOMContentLoaded', async () => {
    const userId = sessionStorage.getItem('userId');
    const userRole = sessionStorage.getItem('userRole');
    
    if (!userId || userRole !== 'student') {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize - show profile section by default
    showSection('profile');
    
    await loadUserData(userId);
    await loadPlacements();
    await loadApplicationForms();
    await loadApplicationStatus();
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
    document.getElementById('studentName').textContent = user.fullName;
    document.getElementById('profileName').textContent = user.fullName;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileStudentId').textContent = user.studentId;
    document.getElementById('profilePhone').textContent = user.phone;
    document.getElementById('profileDepartment').textContent = user.department;
    document.getElementById('profileYear').textContent = `Year ${user.year}`;
    
    // Set initials
    const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('profileInitials').textContent = initials;
    
    // Display resume if exists
    if (user.resumeUrl) {
        document.getElementById('resumeDisplay').innerHTML = `
            <a href="${user.resumeUrl}" target="_blank" class="text-purple-600 hover:underline flex items-center">
                <i class="fas fa-file-pdf mr-2"></i>View Uploaded Resume
            </a>
        `;
    }
    
    // Pre-fill update form
    document.getElementById('updateName').value = user.fullName;
    document.getElementById('updatePhone').value = user.phone;
    document.getElementById('updateDepartment').value = user.department;
    document.getElementById('updateYear').value = user.year;
    
    // Pre-fill resume form
    document.getElementById('resumeName').value = user.fullName;
    document.getElementById('resumeEmail').value = user.email;
    document.getElementById('resumePhone').value = user.phone;
    
    // Pre-fill application form student details
    if (document.getElementById('formStudentName')) {
        document.getElementById('formStudentName').value = user.fullName;
        document.getElementById('formStudentEmail').value = user.email;
        document.getElementById('formDepartment').value = user.department;
        document.getElementById('formYear').value = `Year ${user.year}`;
        // Set today's date as default
        document.getElementById('formDate').value = new Date().toISOString().split('T')[0];
    }
}

async function loadPlacements() {
    try {
        const placementsQuery = query(collection(db, 'placements'), orderBy('postedAt', 'desc'));
        const querySnapshot = await getDocs(placementsQuery);
        const placementsList = document.getElementById('placementsList');
        
        console.log('Loading placements for student:', currentUser);
        console.log('Student department:', currentUser?.department);
        
        if (querySnapshot.empty) {
            placementsList.innerHTML = '<p class="text-gray-600 dark:text-gray-400">No placements available at the moment.</p>';
            return;
        }
        
        placementsList.innerHTML = '';
        const now = new Date();
        let visibleCount = 0;
        let filteredCount = 0;
        
        querySnapshot.forEach((doc) => {
            const placement = doc.data();
            const deadline = new Date(placement.deadline);
            
            console.log('Checking placement:', placement.companyName, 'Eligible depts:', placement.eligibleDepartments);
            
            // Skip expired placements
            if (deadline < now) {
                console.log('Skipped (expired):', placement.companyName);
                return;
            }
            
            // Check if student's department is eligible
            const eligibleDepts = placement.eligibleDepartments || [];
            const isEligible = eligibleDepts.includes('All') || eligibleDepts.includes(currentUser.department);
            
            if (!isEligible) {
                console.log('Filtered out:', placement.companyName, 'Student dept:', currentUser.department, 'Eligible:', eligibleDepts);
                filteredCount++;
                // Still show the placement but mark as not eligible
                // Uncomment next line to hide completely:
                // return;
            }
            
            visibleCount++;
            
            const placementCard = document.createElement('div');
            placementCard.className = `bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${!isEligible ? 'border-2 border-yellow-400 dark:border-yellow-600' : ''}`;
            placementCard.innerHTML = `
                ${!isEligible ? `
                    <div class="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-30 border-l-4 border-yellow-500 rounded">
                        <p class="text-yellow-800 dark:text-yellow-300 text-sm font-semibold">
                            <i class="fas fa-exclamation-triangle mr-2"></i>Not eligible for your department (${currentUser.department})
                        </p>
                    </div>
                ` : ''}
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="text-2xl font-bold text-gray-800 dark:text-white">${placement.companyName}</h3>
                            ${isEligible ? '<span class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-semibold"><i class="fas fa-check-circle mr-1"></i>Eligible</span>' : ''}
                        </div>
                        <p class="text-purple-600 dark:text-purple-400 font-semibold">${placement.jobRole}</p>
                    </div>
                    <span class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full font-semibold">${placement.package} LPA</span>
                </div>
                <div class="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <i class="fas fa-map-marker-alt text-gray-600 dark:text-gray-400 mr-2"></i>
                        <span class="text-gray-700 dark:text-gray-300">${placement.location}</span>
                    </div>
                    <div>
                        <i class="fas fa-clock text-gray-600 dark:text-gray-400 mr-2"></i>
                        <span class="text-gray-700 dark:text-gray-300">Deadline: ${new Date(placement.deadline).toLocaleString()}</span>
                    </div>
                </div>
                <div class="mb-3">
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        <i class="fas fa-building mr-2"></i><strong>Eligible for:</strong> ${eligibleDepts.join(', ')}
                    </p>
                </div>
                <div class="mb-4">
                    <h4 class="font-semibold text-gray-800 dark:text-white mb-2">Job Description:</h4>
                    <p class="text-gray-600 dark:text-gray-300">${placement.jobDescription}</p>
                </div>
                <div class="mb-4">
                    <h4 class="font-semibold text-gray-800 dark:text-white mb-2">Requirements:</h4>
                    <p class="text-gray-600 dark:text-gray-300">${placement.requirements}</p>
                </div>
                <button onclick="applyForPlacement('${doc.id}', '${placement.companyName}', '${placement.applicationLink}')" 
                        class="w-full ${isEligible ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'} text-white py-3 rounded-lg font-semibold transition"
                        ${!isEligible ? 'disabled title="Not eligible for your department"' : ''}>
                    <i class="fas fa-paper-plane mr-2"></i>${isEligible ? 'Apply Now' : 'Not Eligible to Apply'}
                </button>
            `;
            placementsList.appendChild(placementCard);
        });
        
        console.log(`Placements loaded: ${visibleCount} visible, ${filteredCount} filtered by department`);
        
        // Add info message if some placements were filtered
        if (filteredCount > 0) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'mt-4 p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 border-l-4 border-blue-500 rounded';
            infoDiv.innerHTML = `
                <p class="text-blue-800 dark:text-blue-300">
                    <i class="fas fa-info-circle mr-2"></i>
                    <strong>Note:</strong> Some placements shown above are not eligible for your department (${currentUser.department}). 
                    You can view them for reference, but you cannot apply.
                </p>
            `;
            placementsList.appendChild(infoDiv);
        }
        
        if (visibleCount === 0) {
            placementsList.innerHTML = '<p class="text-gray-600 dark:text-gray-400">No active placements available at the moment.</p>';
        }
    } catch (error) {
        console.error('Error loading placements:', error);
        document.getElementById('placementsList').innerHTML = `
            <div class="bg-red-50 dark:bg-red-900 dark:bg-opacity-30 rounded-lg p-6">
                <p class="text-red-700 dark:text-red-300 font-semibold">Error loading placements</p>
                <p class="text-red-600 dark:text-red-400 text-sm mt-2">${error.message}</p>
            </div>
        `;
    }
}

window.applyForPlacement = function(placementId, companyName, applicationLink) {
    currentPlacementId = placementId;
    sessionStorage.setItem('pendingPlacement', JSON.stringify({ placementId, companyName, applicationLink }));
    document.getElementById('placementModal').classList.remove('hidden');
    document.getElementById('placementModal').classList.add('flex');
};

window.closeModal = function() {
    document.getElementById('placementModal').classList.add('hidden');
    document.getElementById('placementModal').classList.remove('flex');
    currentPlacementId = null;
    sessionStorage.removeItem('pendingPlacement');
};

window.redirectToForm = function() {
    const pendingPlacement = JSON.parse(sessionStorage.getItem('pendingPlacement'));
    if (pendingPlacement && pendingPlacement.applicationLink) {
        window.open(pendingPlacement.applicationLink, '_blank');
    }
    closeModal();
    showSection('forms');
    
    // Auto-open the application form and pre-fill data
    setTimeout(() => {
        // Open the form if it's hidden
        const formContainer = document.getElementById('applicationFormContainer');
        if (formContainer && formContainer.classList.contains('hidden')) {
            toggleApplicationForm();
        }
    }, 100);
};

window.loadApplicationForms = async function() {
    const formsList = document.getElementById('formsList');
    
    try {
        // Simple query without orderBy to avoid index requirement
        const formsQuery = query(
            collection(db, 'applicationForms'),
            where('studentId', '==', currentUser.id)
        );
        const querySnapshot = await getDocs(formsQuery);
        
        if (querySnapshot.empty) {
            formsList.innerHTML = '<p class="text-gray-600 dark:text-gray-400 text-center">No applications submitted yet. Click "New Application" button above to submit your first application.</p>';
            return;
        }
        
        // Convert to array and sort by date (client-side sorting)
        const forms = [];
        querySnapshot.forEach((doc) => {
            forms.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by submittedAt in descending order (newest first)
        forms.sort((a, b) => {
            const dateA = new Date(a.submittedAt);
            const dateB = new Date(b.submittedAt);
            return dateB - dateA;
        });
        
        formsList.innerHTML = '';
        
        forms.forEach((form) => {
            const formCard = document.createElement('div');
            formCard.className = 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition';
            formCard.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <h4 class="text-lg font-bold text-gray-800 dark:text-white">${form.companyName}</h4>
                            <span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-semibold">${form.applicationStatus || 'Applied'}</span>
                        </div>
                        <p class="text-gray-700 dark:text-gray-300 mb-1"><strong>Position:</strong> ${form.position}</p>
                        <p class="text-gray-600 dark:text-gray-400 text-sm mb-1"><strong>Department:</strong> ${form.department} - Year ${form.year}</p>
                        <p class="text-gray-500 dark:text-gray-400 text-sm"><strong>Submitted:</strong> ${new Date(form.submittedAt).toLocaleString()}</p>
                        ${form.notes ? `<p class="text-gray-600 dark:text-gray-400 text-sm mt-2"><strong>Notes:</strong> ${form.notes}</p>` : ''}
                    </div>
                </div>
            `;
            formsList.appendChild(formCard);
        });
    } catch (error) {
        console.error('Error loading forms:', error);
        console.error('Error details:', error.message);
        
        // Show more helpful error message
        formsList.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-red-700 font-semibold mb-2">⚠️ Error loading applications</p>
                <p class="text-red-600 text-sm mb-2">${error.message}</p>
                <p class="text-gray-600 text-sm">This might be because:</p>
                <ul class="text-gray-600 text-sm list-disc ml-5 mt-2">
                    <li>No applications have been submitted yet</li>
                    <li>Firestore rules need to be updated</li>
                    <li>Network connection issue</li>
                </ul>
                <button onclick="loadApplicationForms()" class="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm">
                    <i class="fas fa-sync mr-2"></i>Retry
                </button>
            </div>
        `;
    }
}

// Toggle application form visibility
window.toggleApplicationForm = function() {
    const formContainer = document.getElementById('applicationFormContainer');
    const toggleBtn = document.getElementById('toggleFormBtn');
    
    if (formContainer.classList.contains('hidden')) {
        formContainer.classList.remove('hidden');
        toggleBtn.innerHTML = '<i class="fas fa-times mr-2"></i>Cancel';
        toggleBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
        toggleBtn.classList.add('bg-gray-500', 'hover:bg-gray-600');
        
        // Pre-fill student data
        if (currentUser) {
            document.getElementById('formStudentName').value = currentUser.fullName;
            document.getElementById('formStudentEmail').value = currentUser.email;
            document.getElementById('formDepartment').value = currentUser.department;
            document.getElementById('formYear').value = `Year ${currentUser.year}`;
            document.getElementById('formDate').value = new Date().toISOString().split('T')[0];
            
            // Check if there's a pending placement from modal
            const pendingPlacement = JSON.parse(sessionStorage.getItem('pendingPlacement') || '{}');
            if (pendingPlacement.companyName) {
                document.getElementById('formCompanyName').value = pendingPlacement.companyName;
                if (pendingPlacement.jobRole) {
                    document.getElementById('formPosition').value = pendingPlacement.jobRole;
                }
            }
        }
    } else {
        formContainer.classList.add('hidden');
        toggleBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>New Application';
        toggleBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
        toggleBtn.classList.add('bg-purple-600', 'hover:bg-purple-700');
        
        // Reset form
        document.getElementById('newApplicationForm').reset();
    }
}

window.showApplicationForm = function() {
    const formsList = document.getElementById('formsList');
    const pendingPlacement = JSON.parse(sessionStorage.getItem('pendingPlacement') || '{}');
    
    const formHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6 mb-4">
            <h3 class="text-xl font-bold mb-4 text-gray-800">Submit Application Form</h3>
            <form id="applicationForm" onsubmit="submitApplicationForm(event)">
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Company Name</label>
                    <input type="text" id="formCompanyName" value="${pendingPlacement.companyName || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Position Applied For</label>
                    <input type="text" id="formPosition" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Application Date</label>
                    <input type="date" id="formDate" value="${new Date().toISOString().split('T')[0]}" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Application Status</label>
                    <select id="formStatus" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                        <option value="Applied">Applied</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Interview Scheduled">Interview Scheduled</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Selected">Selected</option>
                    </select>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Additional Notes</label>
                    <textarea id="formNotes" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea>
                </div>
                <div class="flex space-x-4">
                    <button type="button" onclick="loadApplicationForms()" class="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition">Cancel</button>
                    <button type="submit" class="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">Submit Form</button>
                </div>
            </form>
        </div>
    `;
    
    formsList.innerHTML = formHTML + formsList.innerHTML;
};

window.submitApplicationForm = async function(event) {
    event.preventDefault();
    
    const submitMessage = document.getElementById('formSubmitMessage');
    
    try {
        const formData = {
            studentId: currentUser.id,
            studentName: currentUser.fullName,
            studentEmail: currentUser.email,
            department: currentUser.department,
            year: currentUser.year,
            companyName: document.getElementById('formCompanyName').value,
            position: document.getElementById('formPosition').value,
            applicationDate: document.getElementById('formDate').value,
            applicationStatus: document.getElementById('formStatus').value,
            notes: document.getElementById('formNotes').value,
            submittedAt: new Date().toISOString()
        };
        
        await addDoc(collection(db, 'applicationForms'), formData);
        
        // Show success message
        submitMessage.textContent = 'Application submitted successfully!';
        submitMessage.className = 'mb-4 p-3 bg-green-100 text-green-700 rounded-lg';
        submitMessage.classList.remove('hidden');
        
        // Reset form and hide it
        document.getElementById('newApplicationForm').reset();
        sessionStorage.removeItem('pendingPlacement');
        
        setTimeout(() => {
            toggleApplicationForm();
            submitMessage.classList.add('hidden');
        }, 2000);
        
        // Reload forms list
        await loadApplicationForms();
    } catch (error) {
        console.error('Error submitting form:', error);
        submitMessage.textContent = 'Error submitting form. Please try again.';
        submitMessage.className = 'mb-4 p-3 bg-red-100 text-red-700 rounded-lg';
        submitMessage.classList.remove('hidden');
    }
};

window.uploadResume = async function() {
    const fileInput = document.getElementById('resumeFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a PDF file to upload.');
        return;
    }
    
    if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file only.');
        return;
    }
    
    try {
        // Delete old resume files from Firebase Storage
        const userResumeFolder = ref(storage, `resumes/${currentUser.id}`);
        try {
            const listResult = await listAll(userResumeFolder);
            // Delete all existing files in the user's resume folder
            const deletePromises = listResult.items.map(itemRef => deleteObject(itemRef));
            await Promise.all(deletePromises);
            console.log('Old resume files deleted successfully');
        } catch (deleteError) {
            console.log('No old resume to delete or error deleting:', deleteError.message);
        }
        
        // Upload new resume
        const storageRef = ref(storage, `resumes/${currentUser.id}/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        // Update user document with new resume URL
        await updateDoc(doc(db, 'users', currentUser.id), {
            resumeUrl: downloadURL,
            resumeFileName: file.name,
            resumeUpdatedAt: new Date().toISOString()
        });
        
        currentUser.resumeUrl = downloadURL;
        document.getElementById('resumeDisplay').innerHTML = `
            <a href="${downloadURL}" target="_blank" class="text-purple-600 hover:underline flex items-center">
                <i class="fas fa-file-pdf mr-2"></i>View Uploaded Resume
            </a>
        `;
        
        alert('Resume uploaded successfully! Old resume has been replaced.');
    } catch (error) {
        console.error('Error uploading resume:', error);
        alert('Error uploading resume. Please try again.');
    }
};

window.generateResume = function() {
    // Personal Information
    const name = document.getElementById('resumeName').value;
    const title = document.getElementById('resumeTitle').value;
    const email = document.getElementById('resumeEmail').value;
    const phone = document.getElementById('resumePhone').value;
    const linkedin = document.getElementById('resumeLinkedIn').value;
    const github = document.getElementById('resumeGitHub').value;
    const address = document.getElementById('resumeAddress').value;
    const summary = document.getElementById('resumeSummary').value;
    
    // Education details
    const sscSchool = document.getElementById('sscSchool').value;
    const sscYear = document.getElementById('sscYear').value;
    const sscPercentage = document.getElementById('sscPercentage').value;
    
    const hscCollege = document.getElementById('hscCollege').value;
    const hscYear = document.getElementById('hscYear').value;
    const hscPercentage = document.getElementById('hscPercentage').value;
    
    const beCollege = document.getElementById('beCollege').value;
    const beDepartment = document.getElementById('beDepartment').value;
    const beYear = document.getElementById('beYear').value;
    const beCGPA = document.getElementById('beCGPA').value;
    
    // Skills
    const programmingLangs = document.getElementById('programmingLangs').value;
    const frontendSkills = document.getElementById('frontendSkills').value;
    const backendSkills = document.getElementById('backendSkills').value;
    const databasePlatforms = document.getElementById('databasePlatforms').value;
    const concepts = document.getElementById('concepts').value;
    const softSkills = document.getElementById('softSkills').value;
    
    // Projects
    const projectEntries = document.querySelectorAll('.project-entry');
    let projectsHTML = '';
    projectEntries.forEach(entry => {
        const projName = entry.querySelector('.project-name').value;
        const projDesc = entry.querySelector('.project-desc').value;
        if (projName) {
            projectsHTML += `
                <div class="mb-3">
                    <p class="font-semibold text-gray-800">${projName}</p>
                    <p class="text-gray-700 text-sm">${projDesc}</p>
                </div>
            `;
        }
    });
    
    // Experience
    const expEntries = document.querySelectorAll('.experience-entry');
    let experienceHTML = '';
    expEntries.forEach(entry => {
        const expTitle = entry.querySelector('.exp-title').value;
        const expCompany = entry.querySelector('.exp-company').value;
        const expDuration = entry.querySelector('.exp-duration').value;
        const expDesc = entry.querySelector('.exp-desc').value;
        if (expTitle) {
            experienceHTML += `
                <div class="mb-3">
                    <p class="font-semibold text-gray-800">${expTitle} - ${expCompany}</p>
                    <p class="text-gray-600 text-sm italic">${expDuration}</p>
                    <p class="text-gray-700 text-sm">${expDesc}</p>
                </div>
            `;
        }
    });
    
    const hackathons = document.getElementById('hackathons').value;
    const leadership = document.getElementById('leadership').value;
    
    const preview = document.getElementById('resumePreview');
    preview.innerHTML = `
        <div class="resume-content bg-white p-8" style="font-family: 'Times New Roman', serif; color: #333; line-height: 1.6;">
            <!-- Header -->
            <div class="border-b-2 border-gray-400 pb-4 mb-4">
                <h1 class="text-4xl font-bold text-gray-800 mb-2" style="letter-spacing: 2px;">${name.toUpperCase()}</h1>
                <p class="text-lg text-gray-600 mb-3">${title}</p>
                <div class="grid grid-cols-2 gap-2 text-sm text-gray-700">
                    <div class="flex items-center">
                        <i class="fas fa-phone mr-2"></i>
                        <span>${phone}</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-envelope mr-2"></i>
                        <span>${email}</span>
                    </div>
                    ${linkedin ? `
                        <div class="flex items-center">
                            <i class="fab fa-linkedin mr-2"></i>
                            <span class="text-xs">${linkedin}</span>
                        </div>
                    ` : ''}
                    ${github ? `
                        <div class="flex items-center">
                            <i class="fab fa-github mr-2"></i>
                            <span class="text-xs">${github}</span>
                        </div>
                    ` : ''}
                </div>
                ${address ? `<p class="text-sm text-gray-600 mt-2"><i class="fas fa-map-marker-alt mr-2"></i>${address}</p>` : ''}
            </div>
            
            <!-- Summary -->
            ${summary ? `
                <div class="mb-4">
                    <h2 class="text-xl font-bold text-gray-800 mb-2 pb-1 border-b-2 border-gray-400" style="letter-spacing: 1px;">SUMMARY</h2>
                    <p class="text-gray-700 text-sm text-justify">${summary}</p>
                </div>
            ` : ''}
            
            <!-- Two Column Layout -->
            <div class="grid grid-cols-5 gap-6">
                <!-- Left Column -->
                <div class="col-span-2">
                    <!-- Education -->
                    <div class="mb-4">
                        <h2 class="text-xl font-bold text-gray-800 mb-2 pb-1 border-b-2 border-gray-400" style="letter-spacing: 1px;">EDUCATION</h2>
                        
                        ${beCollege ? `
                            <div class="mb-3">
                                <p class="font-bold text-gray-800 text-sm">${beCollege.toUpperCase()}</p>
                                <p class="text-gray-700 text-xs">B.E. IN ${beDepartment ? beDepartment.toUpperCase() : 'ENGINEERING'}: ${beYear ? beYear : ''}</p>
                                ${beCGPA ? `<p class="text-gray-700 text-xs">CGPA: ${beCGPA}</p>` : ''}
                            </div>
                        ` : ''}
                        
                        ${hscCollege ? `
                            <div class="mb-3">
                                <p class="font-bold text-gray-800 text-sm">MODEL COLLEGE</p>
                                <p class="text-gray-700 text-xs">SCIENCE (HSC): ${hscYear ? hscYear : ''} - ${hscPercentage ? hscPercentage : ''}</p>
                            </div>
                        ` : ''}
                        
                        ${sscSchool ? `
                            <div class="mb-3">
                                <p class="font-bold text-gray-800 text-sm">${sscSchool.toUpperCase()}</p>
                                <p class="text-gray-700 text-xs">SSC: ${sscYear ? sscYear : ''} - ${sscPercentage ? sscPercentage : ''}</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Technical Skills -->
                    ${(programmingLangs || frontendSkills || backendSkills || databasePlatforms || concepts) ? `
                        <div class="mb-4">
                            <h2 class="text-xl font-bold text-gray-800 mb-2 pb-1 border-b-2 border-gray-400" style="letter-spacing: 1px;">TECHNICAL SKILLS</h2>
                            ${programmingLangs ? `
                                <div class="mb-2">
                                    <p class="font-semibold text-gray-800 text-xs">Programming Languages:</p>
                                    <p class="text-gray-700 text-xs">${programmingLangs}</p>
                                </div>
                            ` : ''}
                            ${frontendSkills ? `
                                <div class="mb-2">
                                    <p class="font-semibold text-gray-800 text-xs">Frontend:</p>
                                    <p class="text-gray-700 text-xs">${frontendSkills}</p>
                                </div>
                            ` : ''}
                            ${backendSkills ? `
                                <div class="mb-2">
                                    <p class="font-semibold text-gray-800 text-xs">Backend:</p>
                                    <p class="text-gray-700 text-xs">${backendSkills}</p>
                                </div>
                            ` : ''}
                            ${databasePlatforms ? `
                                <div class="mb-2">
                                    <p class="font-semibold text-gray-800 text-xs">Database & Platforms:</p>
                                    <p class="text-gray-700 text-xs">${databasePlatforms}</p>
                                </div>
                            ` : ''}
                            ${concepts ? `
                                <div class="mb-2">
                                    <p class="font-semibold text-gray-800 text-xs">Concepts:</p>
                                    <p class="text-gray-700 text-xs">${concepts}</p>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    <!-- Soft Skills -->
                    ${softSkills ? `
                        <div class="mb-4">
                            <h2 class="text-xl font-bold text-gray-800 mb-2 pb-1 border-b-2 border-gray-400" style="letter-spacing: 1px;">SOFT SKILLS</h2>
                            <p class="text-gray-700 text-xs">${softSkills}</p>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Right Column -->
                <div class="col-span-3">
                    <!-- Projects -->
                    ${projectsHTML ? `
                        <div class="mb-4">
                            <h2 class="text-xl font-bold text-gray-800 mb-2 pb-1 border-b-2 border-gray-400" style="letter-spacing: 1px;">PROJECTS</h2>
                            ${projectsHTML}
                        </div>
                    ` : ''}
                    
                    <!-- Experience -->
                    ${experienceHTML ? `
                        <div class="mb-4">
                            <h2 class="text-xl font-bold text-gray-800 mb-2 pb-1 border-b-2 border-gray-400" style="letter-spacing: 1px;">WORK EXPERIENCE</h2>
                            ${experienceHTML}
                        </div>
                    ` : ''}
                    
                    <!-- Hackathons -->
                    ${hackathons ? `
                        <div class="mb-4">
                            <h2 class="text-xl font-bold text-gray-800 mb-2 pb-1 border-b-2 border-gray-400" style="letter-spacing: 1px;">HACKATHON PARTICIPANT</h2>
                            <p class="text-gray-700 text-sm whitespace-pre-line">${hackathons}</p>
                        </div>
                    ` : ''}
                    
                    <!-- Leadership & Activities -->
                    ${leadership ? `
                        <div class="mb-4">
                            <h2 class="text-xl font-bold text-gray-800 mb-2 pb-1 border-b-2 border-gray-400" style="letter-spacing: 1px;">LEADERSHIP & ACTIVITIES</h2>
                            <p class="text-gray-700 text-sm whitespace-pre-line">${leadership}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
};

window.addProjectField = function() {
    const container = document.getElementById('projectsContainer');
    const newProject = document.createElement('div');
    newProject.className = 'project-entry mb-4 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700';
    newProject.innerHTML = `
        <div class="mb-2">
            <input type="text" class="project-name w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg mb-2" placeholder="Project Title">
        </div>
        <textarea class="project-desc w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg" rows="3" placeholder="Project description and technologies used"></textarea>
        <button type="button" onclick="this.parentElement.remove()" class="mt-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm">
            <i class="fas fa-trash mr-1"></i>Remove
        </button>
    `;
    container.appendChild(newProject);
};

window.addExperienceField = function() {
    const container = document.getElementById('experienceContainer');
    const newExp = document.createElement('div');
    newExp.className = 'experience-entry mb-4 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700';
    newExp.innerHTML = `
        <div class="grid grid-cols-2 gap-2 mb-2">
            <input type="text" class="exp-title w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg" placeholder="Job Title">
            <input type="text" class="exp-company w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg" placeholder="Company Name">
        </div>
        <div class="mb-2">
            <input type="text" class="exp-duration w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg" placeholder="Duration (e.g., Jan 2023 - Present)">
        </div>
        <textarea class="exp-desc w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg" rows="2" placeholder="Job responsibilities and achievements"></textarea>
        <button type="button" onclick="this.parentElement.remove()" class="mt-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm">
            <i class="fas fa-trash mr-1"></i>Remove
        </button>
    `;
    container.appendChild(newExp);
};

window.downloadResume = function() {
    const preview = document.getElementById('resumePreview');
    
    if (!preview.querySelector('.resume-content')) {
        alert('Please generate a preview first!');
        return;
    }
    
    // Use html2pdf library
    const opt = {
        margin: 10,
        filename: `${document.getElementById('resumeName').value}_Resume.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Load html2pdf library dynamically
    if (typeof html2pdf === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => {
            html2pdf().set(opt).from(preview).save();
        };
        document.head.appendChild(script);
    } else {
        html2pdf().set(opt).from(preview).save();
    }
};

window.updateProfile = async function(event) {
    event.preventDefault();
    
    const updateMessage = document.getElementById('updateMessage');
    
    try {
        const updatedData = {
            fullName: document.getElementById('updateName').value,
            phone: document.getElementById('updatePhone').value,
            department: document.getElementById('updateDepartment').value,
            year: document.getElementById('updateYear').value
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
        section.style.display = 'none';
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('aside a').forEach(link => {
        link.classList.remove('sidebar-active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Add active class to selected nav item
    const navItem = document.getElementById(`nav-${sectionName}`);
    if (navItem) {
        navItem.classList.add('sidebar-active');
    }
};

window.loadApplicationStatus = async function() {
    const statusList = document.getElementById('applicationStatusList');
    
    try {
        const formsQuery = query(
            collection(db, 'applicationForms'),
            where('studentId', '==', currentUser.id)
        );
        const querySnapshot = await getDocs(formsQuery);
        
        if (querySnapshot.empty) {
            statusList.innerHTML = '<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"><p class="text-gray-600 dark:text-gray-400 text-center">No applications submitted yet.</p></div>';
            return;
        }
        
        const forms = [];
        querySnapshot.forEach((doc) => {
            forms.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by submittedAt
        forms.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        
        statusList.innerHTML = '';
        
        forms.forEach((form) => {
            const hasEligibility = form.eligibilityStatus !== undefined;
            const hasInterview = form.interviewStatus !== undefined;
            const hasFeedback = form.facultyNotes && form.facultyNotes.trim() !== '';
            
            let eligibilityBadge = '';
            if (hasEligibility) {
                if (form.eligibilityStatus === 'eligible') {
                    eligibilityBadge = '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fas fa-check-circle mr-1"></i>Eligible</span>';
                } else {
                    eligibilityBadge = '<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fas fa-times-circle mr-1"></i>Not Eligible</span>';
                }
            }
            
            let interviewBadge = '';
            if (hasInterview) {
                if (form.interviewStatus === 'selected') {
                    interviewBadge = '<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fas fa-user-check mr-1"></i>Selected</span>';
                } else if (form.interviewStatus === 'rejected') {
                    interviewBadge = '<span class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fas fa-user-times mr-1"></i>Not Selected</span>';
                } else {
                    interviewBadge = '<span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fas fa-clock mr-1"></i>Pending</span>';
                }
            }
            
            const statusCard = document.createElement('div');
            statusCard.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6';
            statusCard.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-2xl font-bold text-gray-800 dark:text-white">${form.companyName}</h3>
                        <p class="text-gray-600 dark:text-gray-400 font-semibold">${form.position}</p>
                    </div>
                    <span class="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-semibold">${form.applicationStatus || 'Applied'}</span>
                </div>
                
                <div class="mb-4 flex flex-wrap gap-2">
                    ${eligibilityBadge}
                    ${interviewBadge}
                </div>
                
                <div class="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                    <div><span class="text-gray-600 dark:text-gray-400 font-semibold">Department:</span> <span class="text-gray-800 dark:text-gray-200">${form.department}</span></div>
                    <div><span class="text-gray-600 dark:text-gray-400 font-semibold">Applied On:</span> <span class="text-gray-800 dark:text-gray-200">${new Date(form.submittedAt).toLocaleDateString()}</span></div>
                </div>
                
                ${hasFeedback ? `
                    <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 border-l-4 border-blue-500 rounded">
                        <h4 class="font-bold text-gray-800 dark:text-white mb-2 flex items-center">
                            <i class="fas fa-comment-alt mr-2 text-blue-600 dark:text-blue-400"></i>Faculty Feedback
                        </h4>
                        <p class="text-gray-700 dark:text-gray-300 whitespace-pre-line">${form.facultyNotes}</p>
                        ${form.facultyUpdatedAt ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Updated: ${new Date(form.facultyUpdatedAt).toLocaleString()}</p>` : ''}
                    </div>
                ` : '<div class="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded"><p class="text-gray-600 dark:text-gray-400 text-sm"><i class="fas fa-info-circle mr-2"></i>No feedback from faculty yet.</p></div>'}
            `;
            
            statusList.appendChild(statusCard);
        });
    } catch (error) {
        console.error('Error loading application status:', error);
        statusList.innerHTML = `
            <div class="bg-red-50 rounded-lg p-6">
                <p class="text-red-700 font-semibold">Error loading application status</p>
                <p class="text-red-600 text-sm mt-2">${error.message}</p>
            </div>
        `;
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
