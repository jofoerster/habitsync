document.addEventListener('DOMContentLoaded', function () {
    const habitUuid = window.location.pathname.split('/').pop();
    loadHabitRecords(habitUuid);
});

function loadHabitRecords(habitUuid) {
    fetch(`/details/${habitUuid}/records`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch habit records');
            }
            return response.json();
        })
        .then(records => {
            renderCalendarGrid(records, habitUuid);
            calculateStreaks(records);
        })
        .catch(error => {
            console.error('Error loading habit records:', error);
            document.getElementById('day-grid').innerHTML = `
                <div class="alert alert-danger w-100" role="alert">
                    Failed to load habit records. Please try again later.
                </div>
            `;
        });
}

function renderCalendarGrid(records, habitUuid) {
    const gridContainer = document.getElementById('day-grid');
    gridContainer.innerHTML = '';

    const today = new Date();
    today.setHours(10, 0, 0, 0);

    // Start from 30 days ago
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(10, 0, 0, 0);

    let currentMonth = -1;

    // Loop through each day from start date to today
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        // Check if we need to add a month divider
        if (d.getMonth() !== currentMonth) {
            currentMonth = d.getMonth();
            const monthDivider = document.createElement('div');
            monthDivider.className = 'month-divider';
            monthDivider.textContent = new Intl.DateTimeFormat('en-US', {month: 'long'}).format(d);
            gridContainer.appendChild(monthDivider);
        }

        const epochDay = Math.floor(d.getTime() / (24 * 60 * 60 * 1000));
        const record = records[epochDay];

        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = d.getDate();
        dayCell.appendChild(dayNumber);

        const monthLabel = document.createElement('div');
        monthLabel.className = 'month-label';
        monthLabel.textContent = new Intl.DateTimeFormat('en-US', {month: 'short'}).format(d).substring(0, 3);
        dayCell.appendChild(monthLabel);

        // Apply status-based styling
        if (record) {
            switch (record.status) {
                case 'COMPLETED':
                    dayCell.classList.add('status-completed');
                    break;
                case 'COMPLETED_BY_OTHER_RECORDS':
                    dayCell.classList.add('status-completed-by-other');
                    break;
                case 'PARTIALLY_COMPLETED':
                    dayCell.classList.add('status-partial');
                    break;
                case 'MISSED':
                    dayCell.classList.add('status-missed');
                    break;
                default:
                    dayCell.classList.add('status-future');
            }

            // If the record has media, add the indicator
            if (record.mediaPathMap && record.mediaPathMap.PICTURE) {
                dayCell.classList.add('has-media');
            }

            const currentDate = new Date(d.getTime());

            // Add click handler to show modal
            dayCell.addEventListener('click', () => {
                showDayDetails(record, currentDate, habitUuid);
            });
        } else {
            dayCell.classList.add('status-future');
        }

        gridContainer.appendChild(dayCell);
    }
}

function showDayDetails(record, date, habitUuid) {
    const modal = new bootstrap.Modal(document.getElementById('dayDetailsModal'));
    const modalTitle = document.getElementById('dayDetailsModalLabel');
    const modalContent = document.getElementById('dayDetailsContent');

    // Format the date for display
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);

    modalTitle.textContent = formattedDate;

    // Determine status text and class
    let statusText = 'No record';
    let statusClass = 'secondary';

    if (record) {
        switch (record.status) {
            case 'COMPLETED':
                statusText = 'Completed';
                statusClass = 'success';
                break;
            case 'PARTIALLY_COMPLETED':
                statusText = 'Partially Completed';
                statusClass = 'warning';
                break;
            case 'MISSED':
                statusText = 'Missed';
                statusClass = 'danger';
                break;
        }
    }

    // Build modal content
    let content = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="badge bg-${statusClass}">${statusText}</span>
            <span class="fw-bold">${record ? record.value : '0'}</span>
        </div>
    `;

    // If has media, load and show images
    if (record && record.mediaPathMap && record.mediaPathMap.PICTURE) {
        content += `
            <div class="mt-3 text-center">
                <div class="spinner-border text-primary" role="status" id="image-loading">
                    <span class="visually-hidden">Loading image...</span>
                </div>
                <img src="/details/${habitUuid}/record/${record.uuid}/resource/${record.mediaPathMap.PICTURE}" 
                     class="img-fluid" style="display: none"
                     onload="this.style.display='block'; document.getElementById('image-loading').style.display='none';"
                     onerror="this.alt='Failed to load image'; this.style.display='block'; document.getElementById('image-loading').style.display='none';">
            </div>
        `;
    }

    modalContent.innerHTML = content;
    modal.show();
}

function calculateStreaks(records) {
    const today = new Date();
    today.setHours(10, 0, 0, 0);

    let currentStreak = 0;
    let longestStreak = 0;
    let streakActive = true;

    // Start from today and go backwards
    for (let d = new Date(today); ; d.setDate(d.getDate() - 1)) {
        const epochDay = Math.floor(d.getTime() / (24 * 60 * 60 * 1000));
        const record = records[epochDay];

        // If we have a completed record for this day
        if (record && (record.status === 'COMPLETED' || record.status === 'COMPLETED_BY_OTHER_RECORDS')) {
            if (streakActive) {
                currentStreak++;
            }
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            // If we're still counting the current streak and find a non-completed day
            if (streakActive) {
                streakActive = false;
                // Don't reset currentStreak here, as we've already counted it
            }

            // Break if we're not in the current streak anymore and looking at a day with no completion
            if (!streakActive && (!record || record.status !== 'COMPLETED')) {
                break;
            }
        }

        // Stop after checking 100 days to prevent infinite loops
        if (d.getTime() < today.getTime() - (100 * 24 * 60 * 60 * 1000)) {
            break;
        }
    }

    document.getElementById('current-streak').textContent = currentStreak;
}