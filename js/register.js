import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let selectedRole = 'student';

window.selectRole = function(role) {
    selectedRole = role;
    const studentBtn = document.getElementById('studentRoleBtn');
    const facultyBtn = document.getElementById('facultyRoleBtn');
    const studentFields = document.getElementById('studentFields');
    const facultyFields = document.getElementById('facultyFields');
    const studentIdField = document.getElementById('studentIdField');
    const facultyIdField = document.getElementById('facultyIdField');
    
    if (role === 'student') {
        studentBtn.classList.add('bg-purple-600', 'text-white', 'border-purple-600');
        studentBtn.classList.remove('text-purple-600');
        facultyBtn.classList.remove('bg-purple-600', 'text-white', 'border-purple-600');
        facultyBtn.classList.add('border-gray-300', 'text-gray-600');
        studentFields.classList.remove('hidden');
        facultyFields.classList.add('hidden');
        studentIdField.classList.remove('hidden');
        facultyIdField.classList.add('hidden');
        document.getElementById('studentId').required = true;
        document.getElementById('facultyId').required = false;
        document.getElementById('department').required = true;
        document.getElementById('year').required = true;
        document.getElementById('facultyDepartment').required = false;
    } else {
        facultyBtn.classList.add('bg-purple-600', 'text-white', 'border-purple-600');
        facultyBtn.classList.remove('text-gray-600', 'border-gray-300');
        studentBtn.classList.remove('bg-purple-600', 'text-white', 'border-purple-600');
        studentBtn.classList.add('border-gray-300', 'text-purple-600');
        studentFields.classList.add('hidden');
        facultyFields.classList.remove('hidden');
        studentIdField.classList.add('hidden');
        facultyIdField.classList.remove('hidden');
        document.getElementById('studentId').required = false;
        document.getElementById('facultyId').required = true;
        document.getElementById('department').required = false;
        document.getElementById('year').required = false;
        document.getElementById('facultyDepartment').required = true;
    }
};

window.handleRegister = async function(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const phone = document.getElementById('phone').value;
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    // Hide previous messages
    errorMessage.classList.add('hidden');
    successMessage.classList.add('hidden');
    
    // Validate passwords match
    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match!';
        errorMessage.classList.remove('hidden');
        return;
    }
    
    // Validate password length
    if (password.length < 6) {
        errorMessage.textContent = 'Password must be at least 6 characters long!';
        errorMessage.classList.remove('hidden');
        return;
    }
    
    try {
        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Prepare user data
        let userData = {
            fullName,
            email,
            phone,
            role: selectedRole,
            createdAt: new Date().toISOString()
        };
        
        if (selectedRole === 'student') {
            userData.studentId = document.getElementById('studentId').value;
            userData.department = document.getElementById('department').value;
            userData.year = document.getElementById('year').value;
            userData.resumeUrl = '';
        } else {
            userData.facultyId = document.getElementById('facultyId').value;
            userData.department = document.getElementById('facultyDepartment').value;
        }
        
        // Save user data to Firestore
        await setDoc(doc(db, 'users', user.uid), userData);
        
        successMessage.textContent = 'Account created successfully! Redirecting to login...';
        successMessage.classList.remove('hidden');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        let message = 'Registration failed. Please try again.';
        
        if (error.code === 'auth/email-already-in-use') {
            message = 'This email is already registered. Please login instead.';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Invalid email address.';
        } else if (error.code === 'auth/weak-password') {
            message = 'Password is too weak. Please use a stronger password.';
        }
        
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
};

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    const userId = sessionStorage.getItem('userId');
    const userRole = sessionStorage.getItem('userRole');
    
    if (userId && userRole) {
        if (userRole === 'student') {
            window.location.href = 'student-dashboard.html';
        } else {
            window.location.href = 'faculty-dashboard.html';
        }
    }
});
