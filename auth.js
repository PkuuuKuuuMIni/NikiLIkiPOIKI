import { auth, database } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const authSection = document.getElementById('authSection');

// Event Listeners
loginBtn?.addEventListener('click', showLoginForm);
signupBtn?.addEventListener('click', showSignupForm);

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        updateUIForUser(user);
    } else {
        updateUIForGuest();
    }
});

function showLoginForm() {
    authSection.innerHTML = `
        <div class="card">
            <h2>Login</h2>
            <form id="loginForm" class="auth-form">
                <div class="form-group">
                    <input type="email" class="form-control" placeholder="Email" required>
                </div>
                <div class="form-group">
                    <input type="password" class="form-control" placeholder="Password" required>
                </div>
                <button type="submit" class="btn btn-primary">Login</button>
            </form>
        </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const [email, password] = e.target.elements;
        
        try {
            await signInWithEmailAndPassword(auth, email.value, password.value);
            showMessage('success', 'Successfully logged in!');
            window.location.href = '/edit-profile';
        } catch (error) {
            showMessage('error', getAuthErrorMessage(error));
        }
    });
}

function showSignupForm() {
    authSection.innerHTML = `
        <div class="card">
            <h2>Create Account</h2>
            <form id="signupForm" class="auth-form">
                <div class="form-group">
                    <input type="text" class="form-control" placeholder="Username" required pattern="[a-zA-Z0-9_-]{3,15}">
                    <small class="form-text">3-15 characters, letters, numbers, - and _ only</small>
                </div>
                <div class="form-group">
                    <input type="email" class="form-control" placeholder="Email" required>
                </div>
                <div class="form-group">
                    <input type="password" class="form-control" placeholder="Password" required minlength="6">
                </div>
                <button type="submit" class="btn btn-primary">Create Account</button>
            </form>
        </div>
    `;

    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const [username, email, password] = e.target.elements;

        try {
            // Check if username is available
            const usernameRef = ref(database, `usernames/${username.value}`);
            const usernameSnapshot = await get(usernameRef);
            
            if (usernameSnapshot.exists()) {
                throw new Error('Username already taken');
            }

            // Create user
            const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
            const user = userCredential.user;

            // Update profile with username
            await updateProfile(user, {
                displayName: username.value
            });

            // Create user profile in Realtime Database
            await set(ref(database, `profiles/${user.uid}`), {
                username: username.value,
                email: email.value,
                createdAt: new Date().toISOString(),
                viewCount: 0,
                linkClicks: 0
            });

            // Reserve username
            await set(ref(database, `usernames/${username.value}`), {
                uid: user.uid
            });

            showMessage('success', 'Account created successfully!');
            window.location.href = '/edit-profile';
        } catch (error) {
            showMessage('error', getAuthErrorMessage(error));
        }
    });
}

function updateUIForUser(user) {
    if (loginBtn && signupBtn) {
        loginBtn.textContent = 'My Profile';
        loginBtn.href = '/edit-profile';
        signupBtn.textContent = 'Logout';
        signupBtn.removeEventListener('click', showSignupForm);
        signupBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                window.location.href = '/';
            });
        });
    }
}

function updateUIForGuest() {
    if (loginBtn && signupBtn) {
        loginBtn.textContent = 'Login';
        loginBtn.href = '#';
        signupBtn.textContent = 'Sign Up';
        signupBtn.removeEventListener('click', () => signOut(auth));
        signupBtn.addEventListener('click', showSignupForm);
    }
}

function showMessage(type, message) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    authSection.insertBefore(alert, authSection.firstChild);
    
    setTimeout(() => alert.remove(), 5000);
}

function getAuthErrorMessage(error) {
    switch (error.code) {
        case 'auth/email-already-in-use':
            return 'This email is already registered';
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/operation-not-allowed':
            return 'Email/password accounts are not enabled';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters';
        case 'auth/user-disabled':
            return 'This account has been disabled';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Invalid email or password';
        default:
            return error.message || 'An error occurred';
    }
} 