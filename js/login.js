import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let selectedRole = 'student';

window.selectRole = function(role) {
    selectedRole = role;
    const studentBtn = document.getElementById('studentRoleBtn');
    const facultyBtn = document.getElementById('facultyRoleBtn');
    
    if (role === 'student') {
        studentBtn.classList.add('bg-purple-600', 'text-white', 'border-purple-600');
        studentBtn.classList.remove('text-purple-600');
        facultyBtn.classList.remove('bg-purple-600', 'text-white', 'border-purple-600');
        facultyBtn.classList.add('border-gray-300', 'text-gray-600');
    } else {
        facultyBtn.classList.add('bg-purple-600', 'text-white', 'border-purple-600');
        facultyBtn.classList.remove('text-gray-600', 'border-gray-300');
        studentBtn.classList.remove('bg-purple-600', 'text-white', 'border-purple-600');
        studentBtn.classList.add('border-gray-300', 'text-purple-600');
    }
};

window.handleLogin = async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorMessage = document.getElementById('errorMessage');
    
    try {
        // Sign in with Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Check if role matches
            if (userData.role !== selectedRole) {
                errorMessage.textContent = `This account is registered as ${userData.role}. Please select the correct role.`;
                errorMessage.classList.remove('hidden');
                await auth.signOut();
                return;
            }
            
            // Store user data in session
            sessionStorage.setItem('userId', user.uid);
            sessionStorage.setItem('userRole', userData.role);
            sessionStorage.setItem('userName', userData.fullName);
            sessionStorage.setItem('userEmail', userData.email);
            
            // Redirect based on role
            if (selectedRole === 'student') {
                window.location.href = 'student-dashboard.html';
            } else {
                window.location.href = 'faculty-dashboard.html';
            }
        } else {
            errorMessage.textContent = 'User data not found. Please contact administrator.';
            errorMessage.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Login error:', error);
        let message = 'Login failed. Please try again.';
        
        if (error.code === 'auth/user-not-found') {
            message = 'No account found with this email.';
        } else if (error.code === 'auth/wrong-password') {
            message = 'Incorrect password.';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Invalid email address.';
        } else if (error.code === 'auth/too-many-requests') {
            message = 'Too many failed attempts. Please try again later.';
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
