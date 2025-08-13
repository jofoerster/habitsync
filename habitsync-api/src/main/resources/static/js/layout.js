// Simple toast function
function showToast(message, type = 'success') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;

    // Append to body
    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Hide and remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered:', reg.scope))
            .catch(err => console.error('Service Worker error:', err));
    });
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Optionally show your custom install button here
    const btn = document.getElementById('installBtn');
    if (btn) {
        btn.style.display = 'block';
        btn.addEventListener('click', () => {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(choice => {
                if (choice.outcome === 'accepted') {
                    console.log('User accepted the install');
                }
                deferredPrompt = null;
            });
        });
    }
});

const overlay = document.getElementById('loading-overlay');

document.querySelectorAll('.bottom-nav-item').forEach(el => {
    el.addEventListener('click', () => {
        overlay.style.display = 'flex';
    });
});

window.addEventListener('load', () => {
    overlay.style.display = 'none';
});

// Enable tooltips globally
document.addEventListener("DOMContentLoaded", function () {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });
});