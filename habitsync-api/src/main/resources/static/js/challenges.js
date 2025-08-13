// Modal functionality
const modal = document.getElementById('createChallengeModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeBtns = document.querySelectorAll('.close-modal, .close-modal-btn');

openModalBtn.addEventListener('click', function () {
    modal.style.display = 'block';
});

closeBtns.forEach(btn => {
    btn.addEventListener('click', function () {
        modal.style.display = 'none';
    });
});

window.addEventListener('click', function (event) {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Frequency Custom Form Logic
function updateFreqCustomForm() {
    const freqType = document.getElementById('freqType').value;
    const freqCustom = document.getElementById('freqCustom');
    const freqCustomSimple = document.getElementById('freqCustomSimple');
    const freqCustomX = document.getElementById('freqCustomX');
    const freqCustomY = document.getElementById('freqCustomY');

    // Hide/show appropriate form fields
    if (freqType === '3') {
        document.querySelector('.freqcustom-1-2').classList.add('hidden-freqcustom');
        document.querySelector('.freqcustom-3').classList.remove('hidden-freqcustom');
    } else {
        document.querySelector('.freqcustom-1-2').classList.remove('hidden-freqcustom');
        document.querySelector('.freqcustom-3').classList.add('hidden-freqcustom');
    }

    // Update hidden field before form submission
    document.querySelector('form').addEventListener('submit', function () {
        if (freqType === '1' || freqType === '2') {
            freqCustom.value = freqCustomSimple.value;
        } else if (freqType === '3') {
            freqCustom.value = freqCustomX.value + ',' + freqCustomY.value;
        }
    });
}

// Initialize form on load
document.addEventListener('DOMContentLoaded', function () {
    updateFreqCustomForm();

    // Set initial values if editing
    const freqCustomValue = document.getElementById('freqCustom').value;
    if (freqCustomValue) {
        const freqType = document.getElementById('freqType').value;
        if (freqType === '1' || freqType === '2') {
            document.getElementById('freqCustomSimple').value = freqCustomValue;
        } else if (freqType === '3' && freqCustomValue.includes(',')) {
            const values = freqCustomValue.split(',');
            document.getElementById('freqCustomX').value = values[0].trim();
            document.getElementById('freqCustomY').value = values[1].trim();
        }
    }
});

//display live timer
const endDate = document.getElementById("endDate").textContent.trim();
const targetDate = new Date(`${endDate}T23:59:59`).getTime();
const countdown = document.getElementById("countdown");
const totalTime = 30 * 24 * 60 * 60 * 1000;

const updateCountdown = () => {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
        countdown.innerText = "Time's up!";
        clearInterval(intervalId);
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    let timeParts = [];

    if (days > 0) timeParts.push(`${days}d`);
    if (hours > 0) timeParts.push(`${hours}h`);
    if (minutes > 0) timeParts.push(`${minutes}m`);
    timeParts.push(`${seconds}s`);

    countdown.innerText = timeParts.join(" ");

    const ratio = distance / totalTime;
    const r = Math.floor(255 * (1 - ratio));
    const g = Math.floor(255 * ratio);
    const color = `rgb(${r},${g},0)`;

    countdown.style.setProperty('--countdown-color', color);
};

const intervalId = setInterval(updateCountdown, 1000);
updateCountdown();