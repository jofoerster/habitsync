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
    const freqCustomValueTrimmed = freqCustomValue.replace(/[\[\]]/g, "");

    if (freqCustomValueTrimmed) {
        const freqType = document.getElementById('freqType').value;
        if (freqType === '1' || freqType === '2') {
            document.getElementById('freqCustomSimple').value = freqCustomValueTrimmed;
        } else if (freqType === '3' && freqCustomValueTrimmed.includes(',')) {
            const values = freqCustomValueTrimmed.split(',');
            document.getElementById('freqCustomX').value = values[0].trim();
            document.getElementById('freqCustomY').value = values[1].trim();
        }
    }
});