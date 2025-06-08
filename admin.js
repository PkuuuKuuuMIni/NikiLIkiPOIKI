import { auth, database } from '../js/firebase-config.js'; // Увери се, че пътят е верен
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { ref, get, child, remove as firebaseRemove } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const loginForm = document.getElementById('admin-login-form');
const loginErrorMessage = document.getElementById('login-error-message');

const adminDashboard = document.getElementById('admin-dashboard');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const usersListTableBody = document.getElementById('users-list');
const userCountElement = document.getElementById('user-count');

// --- АВТЕНТИКАЦИЯ И ПРОВЕРКА ЗА АДМИН ---

function checkAdminAccess(onSuccess, onFailure) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            user.getIdTokenResult()
                .then((idTokenResult) => {
                    if (idTokenResult.claims.admin === true) {
                        console.log("Admin access granted for:", user.email);
                        if (onSuccess) onSuccess(user);
                    } else {
                        console.warn("Access denied. User is not an admin:", user.email);
                        if (onFailure) onFailure();
                        else redirectToLogin();
                    }
                })
                .catch(error => {
                    console.error("Error getting ID token result:", error);
                    if (onFailure) onFailure();
                    else redirectToLogin();
                });
        } else {
            console.log("No user logged in.");
            if (onFailure) onFailure();
            else redirectToLogin();
        }
    });
}

function redirectToLogin() {
    if (!window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
    }
}

// --- ЛОГИКА ЗА СТРАНИЦАТА ЗА ВХОД (login.html) ---
if (loginForm) {
    // Ако потребителят вече е логнат админ, пренасочи го към таблото
    onAuthStateChanged(auth, (user) => {
        if (user) {
            user.getIdTokenResult().then(idTokenResult => {
                if (idTokenResult.claims.admin === true && window.location.pathname.endsWith('login.html')) {
                    window.location.href = 'dash.html';
                }
            });
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                return user.getIdTokenResult();
            })
            .then((idTokenResult) => {
                if (idTokenResult.claims.admin === true) {
                    console.log("Admin login successful");
                    window.location.href = 'dash.html'; // Пренасочване към таблото
                } else {
                    loginErrorMessage.textContent = 'Нямате администраторски права.';
                    signOut(auth); // Изход, ако не е админ
                }
            })
            .catch((error) => {
                console.error("Admin login error:", error);
                loginErrorMessage.textContent = error.message;
            });
    });
}

// --- ЛОГИКА ЗА АДМИНИСТРАТОРСКОТО ТАБЛО (dash.html) ---
if (adminDashboard) {
    checkAdminAccess(
        (user) => { // Успешна проверка - потребителят е админ
            console.log("Welcome to admin dashboard, admin user:", user.email);
            loadUsers();
            if (adminLogoutBtn) {
                adminLogoutBtn.addEventListener('click', () => {
                    signOut(auth).then(() => {
                        console.log("Admin signed out");
                        window.location.href = 'login.html';
                    }).catch(error => console.error("Sign out error", error));
                });
            }
        },
        () => { // Неуспешна проверка
            redirectToLogin();
        }
    );
}

async function loadUsers() {
    if (!usersListTableBody) return;
    usersListTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Зареждане на потребители...</td></tr>';

    try {
        // ВАЖНО: За да се листнат всички потребители, обикновено се нуждаеш от Firebase Admin SDK на сървъра.
        // Този пример ще зареди данни от Realtime Database, ако имаш колекция 'users' или 'profiles'.
        // За истинско управление на Firebase Auth потребители, ще ти трябва Cloud Function.
        const usersRef = ref(database, 'users'); // Промени 'users' ако твоята колекция е другаде
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
            usersListTableBody.innerHTML = ''; // Изчистване на "Зареждане..."
            let count = 0;
            snapshot.forEach(childSnapshot => {
                const uid = childSnapshot.key;
                const userData = childSnapshot.val(); // Това са данните от твоята RTDB структура
                
                const row = usersListTableBody.insertRow();
                row.insertCell().textContent = userData.email || 'Няма данни'; // Предполагаме, че пазиш имейл
                row.insertCell().textContent = userData.username || 'Няма данни'; // Предполагаме, че пазиш username
                row.insertCell().textContent = uid;
                
                const actionsCell = row.insertCell();
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Изтрий (Данни)';
                deleteButton.classList.add('btn', 'btn-delete-user');
                deleteButton.onclick = () => {
                    if (confirm(`Сигурни ли сте, че искате да изтриете данните на потребител ${uid}? Това не изтрива Firebase Auth акаунта.`)) {
                        firebaseRemove(child(usersRef, uid))
                            .then(()_ => { alert('Данните на потребителя са изтрити.'); loadUsers(); })
                            .catch(err => alert('Грешка при изтриване: ' + err.message));
                    }
                };
                actionsCell.appendChild(deleteButton);
                // Тук може да добавиш бутон за "Смяна на парола" (който праща имейл за ресет)
                count++;
            });
            if (userCountElement) userCountElement.textContent = `Общо потребители (от базата данни): ${count}`;
        } else {
            usersListTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Няма намерени потребители в базата данни.</td></tr>';
        }
    } catch (error) {
        console.error("Error loading users:", error);
        usersListTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Грешка при зареждане на потребители.</td></tr>';
    }
}