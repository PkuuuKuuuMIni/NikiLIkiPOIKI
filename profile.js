import { db } from './firebase-config.js';
import { doc, getDoc, increment, updateDoc } from 'firebase/firestore';

// Get username from URL path
const username = window.location.pathname.split('/')[1];
const profilePage = document.getElementById('profile-page');
const template = document.getElementById('profile-template');

async function loadProfile() {
    try {
        // Get user data from username
        const usernameDoc = await getDoc(doc(db, 'usernames', username));
        if (!usernameDoc.exists()) {
            showError('Profile not found');
            return;
        }

        // Get profile data
        const uid = usernameDoc.data().uid;
        const profileDoc = await getDoc(doc(db, 'profiles', uid));
        if (!profileDoc.exists()) {
            showError('Profile not found');
            return;
        }

        const profileData = profileDoc.data();
        renderProfile(profileData);
        
        // Increment view count
        await updateDoc(doc(db, 'profiles', uid), {
            viewCount: increment(1)
        });

    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile');
    }
}

function renderProfile(data) {
    // Clone template
    const content = template.content.cloneNode(true);
    
    // Set profile data
    content.querySelector('.profile-image').src = data.photoURL || '/images/default-avatar.png';
    content.querySelector('.profile-name').textContent = data.displayName || 'Anonymous';
    content.querySelector('.profile-username').textContent = '@' + data.username;
    content.querySelector('.profile-bio').textContent = data.bio || '';

    // Render social links
    const linksGrid = content.querySelector('.links-grid');
    if (data.links) {
        Object.entries(data.links).forEach(([platform, url]) => {
            if (url) {
                const link = createSocialLink(platform, url);
                linksGrid.appendChild(link);
            }
        });
    }

    // Update stats
    const stats = content.querySelectorAll('.stat-value');
    stats[0].textContent = formatNumber(data.viewCount || 0);
    stats[1].textContent = formatNumber(data.linkClicks || 0);
    stats[2].textContent = calculateDaysActive(data.createdAt);

    // Replace loading state with content
    profilePage.className = '';
    profilePage.innerHTML = '';
    profilePage.appendChild(content);
}

function createSocialLink(platform, url) {
    const link = document.createElement('a');
    link.href = url;
    link.className = 'link-card';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Add platform icon
    const icon = document.createElement('span');
    icon.className = 'link-icon';
    icon.innerHTML = getPlatformIcon(platform);
    
    const text = document.createElement('span');
    text.textContent = platform.charAt(0).toUpperCase() + platform.slice(1);
    
    link.appendChild(icon);
    link.appendChild(text);
    
    // Track clicks
    link.addEventListener('click', () => trackLinkClick(username, platform));
    
    return link;
}

function getPlatformIcon(platform) {
    // Add SVG icons for different platforms
    const icons = {
        twitter: '<svg viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>',
        instagram: '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>',
        github: '<svg viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>',
        // Add more platform icons as needed
    };
    
    return icons[platform.toLowerCase()] || '<svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
}

async function trackLinkClick(username, platform) {
    try {
        const usernameDoc = await getDoc(doc(db, 'usernames', username));
        if (usernameDoc.exists()) {
            const uid = usernameDoc.data().uid;
            await updateDoc(doc(db, 'profiles', uid), {
                linkClicks: increment(1)
            });
        }
    } catch (error) {
        console.error('Error tracking link click:', error);
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function calculateDaysActive(createdAt) {
    if (!createdAt) return 0;
    const created = createdAt.toDate();
    const now = new Date();
    const diffTime = Math.abs(now - created);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function showError(message) {
    profilePage.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <h2 style="color: var(--text-muted);">${message}</h2>
            <a href="/" class="btn btn-primary" style="display: inline-block; margin-top: 1rem;">
                Return Home
            </a>
        </div>
    `;
    profilePage.className = '';
}

// Load profile when page loads
loadProfile(); 