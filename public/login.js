// Simple logic to redirect to the dashboard page upon clicking "Sign In" or "Demo Login"

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    // Simulate authentication
    window.location.href = 'dashboard.html';
});

document.getElementById('demoLoginBtn').addEventListener('click', () => {
    // Simulate authentication
    window.location.href = 'dashboard.html';
});

// Toggle Password Visibility
const showPasswordToggle = document.querySelector('.show-password');
const passwordInput = document.querySelector('input[type="password"]');

showPasswordToggle.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        showPasswordToggle.textContent = 'Hide';
    } else {
        passwordInput.type = 'password';
        showPasswordToggle.textContent = 'Show';
    }
});