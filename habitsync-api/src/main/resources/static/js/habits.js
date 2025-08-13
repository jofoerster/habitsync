// Initialize current date for the progress form
document.addEventListener('DOMContentLoaded', function () {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    if (document.getElementById('progressDate')) {
        document.getElementById('progressDate').value = formattedDate;
    }

    // Copy share code functionality
    document.querySelectorAll('.copy-code').forEach(button => {
        button.addEventListener('click', function () {
            const code = this.getAttribute('data-code');
            navigator.clipboard.writeText(code)
                .then(() => {
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="bi bi-check-lg me-1"></i> Copied!';
                    setTimeout(() => {
                        this.innerHTML = originalText;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                    alert('Failed to copy code');
                });
        });
    });
});

// Join shared habit functionality
document.getElementById('joinSharedButton')?.addEventListener('click', function () {
    const shareCode = document.getElementById('shareCode').value;

    if (!shareCode) {
        alert('Please enter a share code');
        return;
    }

    window.location.href = '/shared/' + shareCode;
});

// Log progress functionality
function recordProgress(habitId) {
    document.getElementById('habitId').value = habitId;
    const logProgressModal = new bootstrap.Modal(document.getElementById('logProgressModal'));
    logProgressModal.show();
}

// Filter options
document.querySelectorAll('.filter-option').forEach(option => {
    option.addEventListener('click', function () {
        // Update active class
        document.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
        this.classList.add('active');

        // Get filter type
        const filterType = this.getAttribute('data-filter');

        // Apply filter
        document.querySelectorAll('.habit-card').forEach(card => {
            const parentElement = card.closest('.col-md-6, .col-lg-4');

            if (filterType === 'all') {
                parentElement.style.display = '';
            } else if (filterType === 'active') {
                // This is a simplified example - you'd need to determine "active" status
                parentElement.style.display = '';
            } else if (filterType === 'daily') {
                // You'd need to check if the habit is daily
                const freqType = 1; // Assuming this data is available somehow
                parentElement.style.display = freqType === 1 ? '' : 'none';
            } else if (filterType === 'weekly') {
                // You'd need to check if the habit is weekly
                const freqType = 2; // Assuming this data is available somehow
                parentElement.style.display = freqType === 2 ? '' : 'none';
            } else if (filterType === 'shared') {
                // You'd need to check if the habit is shared
                const isShared = false; // Assuming this data is available somehow
                parentElement.style.display = isShared ? '' : 'none';
            }
        });

        // Show/hide shared habits section based on filter
        const sharedHabitsSection = document.querySelector('.shared-habit-card')?.closest('.mt-5');
        if (sharedHabitsSection) {
            sharedHabitsSection.style.display = (filterType === 'all' || filterType === 'shared') ? '' : 'none';
        }
    });
});


// Functions for handling the medal display
function loadMedalOverview(shareCode, currentAccountId) {
    const modal = document.getElementById('medalOverviewModal');
    const medalContent = document.getElementById('medalContent');
    const loadingSpinner = document.getElementById('medalLoading');

    // Clear previous content
    medalContent.innerHTML = '';

    // Show modal and loading spinner
    modal.style.display = 'block';
    loadingSpinner.style.display = 'flex';

    // Fetch medal data from the endpoint
    fetch(`/shared/${shareCode}/medals`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load medals');
            }
            return response.json();
        })
        .then(data => {
            loadingSpinner.style.display = 'none';
            displayMedals(data, currentAccountId);
        })
        .catch(error => {
            loadingSpinner.style.display = 'none';
            medalContent.innerHTML = `<p class="empty-medal-message">Failed to load medals: ${error.message}</p>`;
        });
}

function displayMedals(data, currentAccountId) {
    const medalContent = document.getElementById('medalContent');

    // If no medal data
    if (!data.medals || Object.keys(data.medals).length === 0) {
        medalContent.innerHTML = '<p class="empty-medal-message">No medals redeemed yet</p>';
        return;
    }

    // Group medals by category
    const categoryMap = {
        'STANDARD': ['GOLD_STANDARD', 'SILVER_STANDARD', 'BRONZE_STANDARD'],
        'CHALLENGE': ['GOLD_CHALLENGE', 'SILVER_CHALLENGE', 'BRONZE_CHALLENGE']
    };

    // Order accounts to put current user first
    const dataSorted = sortDataByCurrentUser(data.medals, currentAccountId);

    // Create medal sections for each account
    dataSorted.forEach(dataElement => {
        const userMedals = dataElement.medals;
        const isCurrentUser = dataElement.account.id == currentAccountId;

        const accountSection = document.createElement('div');
        accountSection.className = `user-medal-section ${isCurrentUser ? 'current-user' : ''}`;
        accountSection.style.animationDelay = `${dataSorted.indexOf(dataElement) * 0.1}s`;

        const nameElement = document.createElement('div');
        nameElement.className = 'user-name';
        nameElement.textContent = dataElement.account.name;
        accountSection.appendChild(nameElement);

        const medalCategories = document.createElement('div');
        medalCategories.className = 'medal-categories';

        // Add each medal category
        Object.keys(categoryMap).forEach(category => {
            const categoryMedals = categoryMap[category].filter(medalType => userMedals[medalType] > 0);

            if (categoryMedals.length > 0) {
                const categorySection = document.createElement('div');
                categorySection.className = 'medal-category';

                const categoryTitle = document.createElement('div');
                categoryTitle.className = 'category-title';
                categoryTitle.textContent = category.charAt(0) + category.slice(1).toLowerCase() + ' Medals';
                categorySection.appendChild(categoryTitle);

                const medalsRow = document.createElement('div');
                medalsRow.className = 'medals-row';

                // Add medals to the category
                categoryMedals.forEach(medalType => {
                    const count = userMedals[medalType];
                    if (count > 0) {
                        const medalItem = createMedalItem(medalType, count);
                        // Add staggered animation delay
                        medalItem.style.animationDelay = `${categoryMedals.indexOf(medalType) * 0.1}s`;
                        medalsRow.appendChild(medalItem);
                    }
                });

                categorySection.appendChild(medalsRow);
                medalCategories.appendChild(categorySection);
            }
        });

        // If no medals in any category
        if (medalCategories.children.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'empty-medal-message';
            emptyMessage.textContent = 'No medals earned yet';
            medalCategories.appendChild(emptyMessage);
        }

        accountSection.appendChild(medalCategories);
        medalContent.appendChild(accountSection);
    });
}

function createMedalItem(medalType, count) {
    const medalInfo = getMedalInfo(medalType);

    const medalItem = document.createElement('div');
    medalItem.className = 'medal-item';

    const medalImg = document.createElement('img');
    medalImg.src = medalInfo.path;
    medalImg.alt = medalInfo.displayName;
    medalImg.className = 'medal-img';
    medalItem.appendChild(medalImg);

    const medalCount = document.createElement('div');
    medalCount.className = 'medal-count';
    medalCount.textContent = 'x' + count;
    medalItem.appendChild(medalCount);

    const medalName = document.createElement('div');
    medalName.className = 'medal-name';
    medalName.textContent = medalInfo.displayName;
    medalItem.appendChild(medalName);

    return medalItem;
}

function getMedalInfo(medalType) {
    const medalInfoMap = {
        'GOLD_STANDARD': {
            displayName: 'Golden Medal',
            path: '/images/medals/gold_standard.png'
        },
        'SILVER_STANDARD': {
            displayName: 'Silver Medal',
            path: '/images/medals/silver_standard.png'
        },
        'BRONZE_STANDARD': {
            displayName: 'Bronze Medal',
            path: '/images/medals/bronze_standard.png'
        },
        'GOLD_CHALLENGE': {
            displayName: 'Golden Challenge Medal',
            path: '/images/medals/gold_standard.png'
        },
        'SILVER_CHALLENGE': {
            displayName: 'Silver Challenge Medal',
            path: '/images/medals/silver_standard.png'
        },
        'BRONZE_CHALLENGE': {
            displayName: 'Bronze Challenge Medal',
            path: '/images/medals/bronze_standard.png'
        }
    };

    return medalInfoMap[medalType];
}

function sortDataByCurrentUser(data, currentAccountId) {
    return data.sort((a, b) => {
        if (a.account.id == currentAccountId) return -1;
        if (b.account.id == currentAccountId) return 1;
        return 0;
    });
}

// Close the modal when clicking on X or outside the modal
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('medalOverviewModal');
    const closeButton = document.querySelector('.close-modal');

    closeButton.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
});