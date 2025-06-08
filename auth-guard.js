import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'firebase/auth';

export function protectRoute() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe(); // Unsubscribe after first check
            if (user) {
                resolve(user);
            } else {
                window.location.href = '/public/login.html';
                reject('Not authenticated');
            }
        });
    });
}

// Check if user is already authenticated, if so redirect to dashboard
export function redirectIfAuthenticated() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe(); // Unsubscribe after first check
            if (user) {
                window.location.href = '/dashboard.html';
                reject('Already authenticated');
            } else {
                resolve();
            }
        });
    });
} 