import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// DOM Elements
const form = document.getElementById('editProfileForm');
const imageUpload = document.getElementById('imageUpload');
const profilePreview = document.getElementById('profilePreview');

// Check Authentication
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadUserProfile(user.uid);
    } else {
        window.location.href = '/';
    }
});

// Load user profile data
async function loadUserProfile(uid) {
    try {
        const profileDoc = await getDoc(doc(db, 'profiles', uid));
        if (profileDoc.exists()) {
            const data = profileDoc.data();
            
            // Set form values
            document.getElementById('displayName').value = data.displayName || '';
            document.getElementById('bio').value = data.bio || '';
            
            // Set social links
            if (data.links) {
                Object.entries(data.links).forEach(([platform, url]) => {
                    const input = document.getElementById(platform);
                    if (input) input.value = url || '';
                });
            }

            // Set profile image
            if (data.photoURL) {
                profilePreview.src = data.photoURL;
            }
        }
    } catch (error) {
        showMessage('error', 'Failed to load profile data');
        console.error('Error loading profile:', error);
    }
}

// Handle image upload preview
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            profilePreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';

    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Not authenticated');

        // Upload image if changed
        let photoURL;
        const imageFile = imageUpload.files[0];
        if (imageFile) {
            const imageRef = ref(storage, `profile-images/${user.uid}`);
            await uploadBytes(imageRef, imageFile);
            photoURL = await getDownloadURL(imageRef);
        }

        // Gather social links
        const links = {};
        ['twitter', 'instagram', 'youtube', 'discord'].forEach(platform => {
            const value = document.getElementById(platform).value.trim();
            if (value) links[platform] = value;
        });

        // Update profile
        await updateDoc(doc(db, 'profiles', user.uid), {
            displayName: document.getElementById('displayName').value.trim(),
            bio: document.getElementById('bio').value.trim(),
            links,
            ...(photoURL && { photoURL }),
            updatedAt: new Date()
        });

        showMessage('success', 'Profile updated successfully!');
    } catch (error) {
        showMessage('error', 'Failed to update profile');
        console.error('Error updating profile:', error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Save Changes';
    }
});

// Helper function to show messages
function showMessage(type, message) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    form.insertBefore(alert, form.firstChild);
    
    setTimeout(() => alert.remove(), 5000);
} 