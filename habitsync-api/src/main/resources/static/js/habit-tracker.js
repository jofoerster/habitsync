document.addEventListener('DOMContentLoaded', function () {
    let longPressTimer;
    let activeRecord = null;
    const popup = document.getElementById('valuePopup');
    const customValueInput = document.getElementById('customValue');

    // Initialize records with stored values
    function initializeRecords() {
        document.querySelectorAll('.habit-record').forEach(record => {
            // Get value from data attribute (populated by Thymeleaf)
            const value = record.dataset.value || '0';
            const daily = record.dataset.daily
            updateRecordDisplay(record, value, daily);

            // Setup event listeners
            setupRecordEvents(record);
        });

        // Setup expandable progress circles
        document.querySelectorAll('.expandable-progress').forEach(progressElement => {
            progressElement.addEventListener('click', function () {
                const habitItem = this.closest('.header-tracker-item-list');
                const habitId = this.dataset.habitId;
                const sharedHabitCode = this.dataset.sharedhabitcode != null ? this.dataset.sharedhabitcode : '';
                const otherHabitsContainer = habitItem.querySelector('.other-habits-container');

                // Toggle the expanded view
                if (otherHabitsContainer.style.display === 'none') {
                    loadOtherHabits(habitId, otherHabitsContainer, sharedHabitCode);
                    otherHabitsContainer.style.display = 'block';
                } else {
                    otherHabitsContainer.style.display = 'none';
                    // Clear content to save memory when collapsed
                    otherHabitsContainer.innerHTML = '';
                }
            });
        });
    }

    function loadOtherHabits(habitId, container, sharedHabitCode = "") {
        // Show loading indicator
        container.innerHTML = '<div class="loading">Loading...</div>';

        // Fetch other people's habits
        fetch(`/habit/${habitId}/otherHabits?sharedHabitForComputation=${sharedHabitCode}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(habits => {
                // Clear loading indicator
                container.innerHTML = '';

                if (habits.length === 0) {
                    container.innerHTML = '<div class="empty-state">No related habits found.</div>';
                    return;
                }

                // Create a list for other habits
                const otherHabitsList = document.createElement('ul');
                otherHabitsList.className = 'header-tracker-list other-habits-list';

                // Add each habit to the list
                habits.forEach(habit => {
                    const habitItem = createOtherHabitItem(habit);
                    otherHabitsList.appendChild(habitItem);
                });

                container.appendChild(otherHabitsList);
            })
            .catch(error => {
                console.error('Error loading other habits:', error);
                container.innerHTML = '<div class="error">Failed to load other habits.</div>';
            });
    }

    function createOtherHabitItem(habit) {
        const li = document.createElement('li');
        li.className = 'header-tracker-item-list other-habit-item';
        li.dataset.id = habit.uuid;

        // Create a wrapper for the main content
        const mainContent = document.createElement('div');
        mainContent.className = 'habit-main-content';

        // Calculate progress percentage and offset
        const percentage = habit.percentage || 0;
        const circumference = 100.48;
        const offset = circumference - (percentage / 100 * circumference);
        const datesLocal = Object.keys(habit.recordByDate).sort().reverse();

        // Create HTML structure similar to main habits but with person's name
        mainContent.innerHTML = `
                <div class="header-tracker-container">
                    <svg class="progress-ring" viewBox="0 0 36 36">
                        <circle class="progress-background" cx="18" cy="18" r="16"></circle>
                        <circle class="progress-bar" cx="18" cy="18" r="16"
                               style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset}"></circle>
                    </svg>
                    <span class="progress-text">${Math.round(percentage)}%</span>
                </div>
                <a class="habit-name person-name" href="${habit.link}">
                <div class="habit-name person-name">${habit.medalOfLastMonth} ${habit.ownerName}</div>
                </a>
                <div class="habit-records">
                        ${datesLocal.map((date, i) => {
            const value = habit.recordByDate && habit.recordByDate[date] ? habit.recordByDate[date] : '0';
            let className = 'habit-record';
            let content = '✗';

            if (Math.abs(value - 1) < 0.00001 && habit.dailyGoal == 1) {
                className += ' completed';
                content = '✓';
            } else if (value >= habit.dailyGoal - 0.00001) {
                className += ' completed'
                content = value;
            } else if (value != '0') {
                className += ' numeric';
                content = value;
            }

            return `<div class="${className}" data-daily="${habit.dailyGoal}" data-value="${value}">${content}</div>`;
        }).join('')}
                    </div>
                `;

        li.appendChild(mainContent);
        return li;
    }

    function setupRecordEvents(record) {
        let longPressTimer = null;
        let startX = 0;
        let startY = 0;
        const moveThreshold = 15; // Pixels of movement allowed before canceling long press

        // Handle regular tap/click
        record.addEventListener('click', function (e) {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
                return; // Don't process click if it was a long press
            }
            if (record.dataset.ischallengehabit === "true") {
                activeRecord = record;
                showValuePopup(record.dataset.habitId);
                return;
            }

            const currentValue = record.dataset.value || '0';
            const newValue = Math.abs(parseFloat(currentValue)) < 0.00001 ? record.dataset.daily : '0';
            updateRecordValue(record, newValue);
        });

        record.addEventListener('pointerdown', e => {
            if (e.button !== 0) return;

            // Store initial touch position
            startX = e.clientX;
            startY = e.clientY;

            longPressTimer = setTimeout(() => {
                activeRecord = record;
                showValuePopup(record.dataset.habitId);
                longPressTimer = null;
            }, 500);

            function handlePointerMove(moveEvent) {
                // Calculate distance moved
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                // Only cancel if movement exceeds threshold
                if (distance > moveThreshold && longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            }

            function cleanup() {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
                record.removeEventListener('pointermove', handlePointerMove);
                record.removeEventListener('pointerup', cleanup);
                record.removeEventListener('pointercancel', cleanup);
            }

            record.addEventListener('pointermove', handlePointerMove, {passive: true});
            record.addEventListener('pointerup', cleanup, {once: true});
            record.addEventListener('pointercancel', cleanup, {once: true});
        });

        // Prevent context menu on long press
        record.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            return false;
        });
    }

    function showValuePopup(habitUuid) {
        const popup = document.getElementById('valuePopup-' + habitUuid);
        if (popup) {
            popup.style.display = 'flex';
            customValueInput.value = '';
        }
    }

    function hideValuePopup(popup) {
        // If a specific popup is provided, hide only that one
        if (popup) {
            popup.style.display = 'none';
        }
        // Otherwise hide all popups (fallback for backward compatibility)
        else {
            document.querySelectorAll('.popup').forEach(p => {
                p.style.display = 'none';
            });
        }
    }

    function updateRecordValue(record, value) {
        const habitId = record.dataset.habitId;
        const dateStr = record.dataset.date;
        const daily = record.dataset.daily;
        const sharedHabitCode = record.dataset.sharedhabitcode != null ? record.dataset.sharedhabitcode : '';

        if (value.startsWith('+')) {
            value = parseFloat(record.dataset.value) + parseFloat(value);
        }

        // Update UI
        updateRecordDisplay(record, value, daily);

        // Send to server and update progress
        sendRecordToServer(record.closest('.header-tracker-item-list'), habitId, dateStr, value, sharedHabitCode);
    }

    function updateRecordDisplay(record, value, daily, completed = null) {
        record.dataset.value = value;
        record.dataset.daily = daily;
        let valueN = parseFloat(record.dataset.value);
        completed = completed == null ? record.dataset.completed : completed;

        if (value === '0' || Math.abs(valueN) < 0.00001) {
            record.textContent = '✗';
            record.classList.remove('completed', 'numeric');
            if (completed === true || completed === "true") {
                record.classList.add('half-completed');
            } else {
                record.classList.remove('half-completed');
            }
        } else if (Math.abs(valueN - 1) < 0.00001 && Math.abs(daily - 1) < 0.00001 && record.dataset.ischallengehabit !== "true") {
            record.textContent = '✓';
            record.classList.add('completed');
            record.classList.remove('numeric', 'half-completed');
        } else if (valueN >= daily - 0.00001) {
            record.textContent = Number.isInteger(valueN) ? valueN.toFixed(0) : valueN;
            record.classList.remove('numeric', 'half-completed');
            record.classList.add('completed');
        } else {
            record.textContent = Number.isInteger(valueN) ? valueN.toFixed(0) : valueN;
            record.classList.add('numeric');
            record.classList.remove('completed');
        }
    }

    function updateHabitProgress(habitItem) {
        const habitUuid = habitItem.dataset.id;

        fetch(`/habit/${habitUuid}/percentage`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const percentage = data.percentage;

                const progressBar = habitItem.querySelector('.progress-bar');
                const circumference = 100.48; // 2 * π * r (where r=16)
                const offset = circumference - (percentage / 100 * circumference);
                progressBar.style.strokeDasharray = circumference;
                progressBar.style.strokeDashoffset = offset;

                const progressText = habitItem.querySelector('.progress-text');
                progressText.textContent = Math.round(percentage) + '%';
            })
            .catch(error => {
                console.error('Error fetching habit percentage:', error);
            });
    }

    function sendRecordToServer(habitItem, habitId, dateStr, value, sharedHabitCode = '') {
        fetch(`/habit/${habitId}/record/${dateStr}?sharedHabitForComputation=${sharedHabitCode}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({value: value})
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Update progress ring with returned percentage
                const percentage = data.percentage;

                const progressBar = habitItem.querySelector('.progress-bar');
                const circumference = 100.48;
                const offset = circumference - (percentage / 100 * circumference);
                progressBar.style.strokeDasharray = circumference;
                progressBar.style.strokeDashoffset = offset;

                const progressText = habitItem.querySelector('.progress-text');
                progressText.textContent = Math.round(percentage) + '%';

                habitItem.querySelectorAll('.habit-record').forEach(record => {
                    // Get value from data attribute (populated by Thymeleaf)
                    const value = record.dataset.value || '0';
                    const daily = record.dataset.daily
                    const completed = data.mapRecordIsCompleted[record.dataset.epochday];
                    const completedResult = completed ? completed : false;
                    updateRecordDisplay(record, value, daily, completedResult);
                });
            })
            .catch(error => {
                console.error('Error updating record and progress:', error);
            });
    }

    document.querySelector(".popup-list").addEventListener('click', function (e) {
        if (e.target.classList.contains('number-btn')) {
            if (activeRecord) {
                const value = e.target.textContent;
                updateRecordValue(activeRecord, value);
                hideValuePopup();
                activeRecord = null;
            }
        }
    });

    // Close popup when clicking outside
    const popups = document.querySelectorAll('.popup');

    // Add click event listener to each popup
    popups.forEach(popup => {
        popup.addEventListener('click', function (e) {
            if (e.target === popup) {
                hideValuePopup(popup);
                activeRecord = null;
            }
        });

        const confirmBtn = popup.querySelector('.popup-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function () {
                if (activeRecord) {
                    const customValueInput = popup.querySelector('#customValue');
                    const value = customValueInput?.value;
                    if (value && !isNaN(value) && parseInt(value) >= 0) {
                        updateRecordValue(activeRecord, value);
                    }
                    hideValuePopup(popup);
                    activeRecord = null;
                }
            });
        }

        const cancelBtn = popup.querySelector('.popup-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function () {
                hideValuePopup(popup);
                activeRecord = null;
            });
        }
    });

    // Support for Enter key in custom value input
    customValueInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.querySelector('.popup-confirm').click();
        }
    });

    // Initialize records
    initializeRecords();
});

$(document).ready(function () {
    // Make the habit list sortable
    $(".header-tracker-list").sortable({
        handle: ".drag-handle",  // Only drag when grabbing this element
        axis: "y",               // Only allow vertical dragging
        update: function (event, ui) {
            // After sorting, update all positions
            updateHabitPositions();
        }
    });

    // Add drag handles to all habit items
    $(".header-tracker-item-list").each(function () {
        const $habitName = $(this).find('a.habit-name');
        $habitName.prepend('<div class="drag-handle">⋮⋮</div>');
    });

    function updateHabitPositions() {
        console.log('Updating habit positions');

        $(".header-tracker-item-list").each(function (index) {
            const habitId = $(this).data('id');
            const own = $(this).data('own');
            if (habitId && own) {
                console.log(`Updating habit ${habitId} to position ${index}`);
                updateHabitPosition(habitId, index);
            }
        });
    }

    function updateHabitPosition(habitId, newPosition) {
        console.log(`Sending request for habit ${habitId} to position ${newPosition}`);

        $.ajax({
            url: `/habit/${habitId}/set-sort-position/${newPosition}`,
            type: 'POST',
            success: function (data) {
                console.log('Habit position updated successfully', data);
            },
            error: function (error) {
                console.error('Error updating habit position:', error);
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    // Get all popup elements
    const popups = document.querySelectorAll('.popup');

    // Add click event listener to each popup for closing
    popups.forEach(popup => {
        popup.addEventListener('click', function (e) {
            if (e.target === popup) {
                hideValuePopup(popup);
                activeRecord = null;
            }
        });

        // Set up edit mode for this popup
        setupEditMode(popup);
    });

    function setupEditMode(popup) {
        const habitUuid = popup.dataset.habitUuid;
        const editButton = popup.querySelector('.edit-button');
        const numberGrid = popup.querySelector('.number-grid');
        const addNumberSection = popup.querySelector('.add-number-section');
        const doneButton = popup.querySelector('.edit-done');
        const cancelButton = popup.querySelector('.popup-cancel');
        const confirmButton = popup.querySelector('.popup-confirm');
        const customValueInput = popup.querySelector('.custom-value-input');

        // Edit button click handler
        editButton.addEventListener('click', function () {
            // Enter edit mode
            enterEditMode();
        });

        // Done button click handler
        doneButton.addEventListener('click', function () {
            // Exit edit mode
            exitEditMode();
        });

        // Add new number handler
        const addNumberBtn = popup.querySelector('.add-number-btn');
        const newNumberInput = popup.querySelector('.new-number-input');

        addNumberBtn.addEventListener('click', function () {
            const newNumber = newNumberInput.value.trim();
            if (newNumber && !isNaN(newNumber)) {
                addNewNumber(newNumber);
                newNumberInput.value = '';
            }
        });

        function enterEditMode() {
            // Show edit mode UI
            addNumberSection.style.display = 'flex';
            doneButton.style.display = 'block';
            cancelButton.style.display = 'none';
            confirmButton.style.display = 'none';
            customValueInput.style.display = 'none';

            // Show remove buttons on all number items
            const removeButtons = numberGrid.querySelectorAll('.remove-number');
            removeButtons.forEach(btn => {
                btn.style.display = 'flex';
            });

            // Disable normal number button functionality
            const numberButtons = numberGrid.querySelectorAll('.number-btn');
            numberButtons.forEach(btn => {
                btn.classList.add('edit-mode');
            });

            // Add event listeners for remove buttons
            setupRemoveButtonListeners();
        }

        function exitEditMode() {
            // Hide edit mode UI
            addNumberSection.style.display = 'none';
            doneButton.style.display = 'none';
            cancelButton.style.display = 'block';
            confirmButton.style.display = 'block';
            customValueInput.style.display = 'block';

            // Hide remove buttons
            const removeButtons = numberGrid.querySelectorAll('.remove-number');
            removeButtons.forEach(btn => {
                btn.style.display = 'none';
            });

            // Re-enable number buttons
            const numberButtons = numberGrid.querySelectorAll('.number-btn');
            numberButtons.forEach(btn => {
                btn.classList.remove('edit-mode');
            });
        }

        function setupRemoveButtonListeners() {
            const removeButtons = numberGrid.querySelectorAll('.remove-number');
            removeButtons.forEach(btn => {
                btn.onclick = function (e) {
                    e.stopPropagation();
                    const numberItem = this.parentElement;
                    const numberValue = numberItem.querySelector('.number-btn').textContent;
                    removeNumber(numberValue);
                };
            });
        }

        function addNewNumber(number) {
            // Send AJAX request to add number
            fetch(`/habitNumberModalConfig/${habitUuid}/add/${number}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    if (response.ok) {
                        // Create new number item in UI
                        const newItem = document.createElement('div');
                        newItem.className = 'number-item';

                        const newBtn = document.createElement('button');
                        newBtn.className = 'number-btn edit-mode';
                        newBtn.textContent = number;

                        const removeSpan = document.createElement('span');
                        removeSpan.className = 'remove-number';
                        removeSpan.textContent = '×';
                        removeSpan.style.display = 'flex';

                        newItem.appendChild(newBtn);
                        newItem.appendChild(removeSpan);
                        numberGrid.appendChild(newItem);

                        removeSpan.onclick = function (e) {
                            e.stopPropagation();
                            removeNumber(number);
                        };
                    } else {
                        console.error('Failed to add number');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        }

        function removeNumber(number) {
            // Send AJAX request to remove number
            fetch(`/habitNumberModalConfig/${habitUuid}/remove/${number}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    if (response.ok) {
                        // Remove number from UI
                        const items = numberGrid.querySelectorAll('.number-item');
                        items.forEach(item => {
                            const btn = item.querySelector('.number-btn');
                            if (btn.textContent === number) {
                                item.remove();
                            }
                        });
                    } else {
                        console.error('Failed to remove number');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        }
    }

    // Function to hide a specific popup
    function hideValuePopup(popup) {
        popup.style.display = 'none';
    }

    // Function to show a specific popup by habit UUID
    window.showValuePopup = function (habitUuid) {
        const popup = document.getElementById('valuePopup-' + habitUuid);
        if (popup) {
            popup.style.display = 'flex';
        }
    };
});