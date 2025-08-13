// Get modal element
const notificationModal = new bootstrap.Modal(document.getElementById('notificationModal'));
const notificationModalBody = document.getElementById('notificationModalBody');
const notificationModalTitle = document.getElementById('notificationModalTitle');

// Current notification ID
let currentNotificationId = null;

// Function to open notification
function openNotification(element) {
    const notificationId = element.getAttribute('data-notification-id');
    currentNotificationId = notificationId;

    // Update modal title
    const subject = element.querySelector('.notification-subject').textContent;
    notificationModalTitle.textContent = subject;

    // Mark as read visually
    element.classList.remove('unread');

    // Fetch the notification HTML content
    fetch(`/notification/${notificationId}/html`)
        .then(response => response.text())
        .then(html => {
            notificationModalBody.innerHTML = html;
            notificationModal.show();

            // Send request to mark as read
            fetch(`/notification/${notificationId}/read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
        })
        .catch(error => {
            console.error('Error loading notification:', error);
            notificationModalBody.innerHTML = `
                            <div class="p-4 text-center">
                                <div class="text-danger mb-3">
                                    <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
                                </div>
                                <h5>Failed to load notification</h5>
                                <p>There was a problem loading this notification. Please try again later.</p>
                            </div>
                        `;
            notificationModal.show();
        });
}

// Handle delete button
document.getElementById('deleteBtn').addEventListener('click', function () {
    if (currentNotificationId) {
        if (true || confirm('Are you sure you want to delete this notification?')) {
            // Send delete request
            fetch(`/notification/${currentNotificationId}`, {
                method: 'DELETE',
            })
                .then(response => {
                    if (response.ok) {
                        // Remove from DOM
                        const element = document.querySelector(`[data-notification-id="${currentNotificationId}"]`);
                        if (element) {
                            element.remove();
                        }

                        // Close modal
                        notificationModal.hide();

                        // Show success toast
                        showToast('Notification deleted successfully');
                    } else {
                        throw new Error('Failed to delete notification');
                    }
                })
                .catch(error => {
                    console.error('Error deleting notification:', error);
                    // Show error toast
                    showToast('Failed to delete notification', 'error');
                });
        }
    }
});

// Mark all as read
document.getElementById('markAllReadBtn').addEventListener('click', function () {
    fetch('/notification/mark-all-read', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(response => {
            if (response.ok) {
                // Update UI - remove all unread classes
                document.querySelectorAll('.notification-item.unread').forEach(item => {
                    item.classList.remove('unread');
                });

                // Show success toast
                showToast('All notifications marked as read');
            } else {
                throw new Error('Failed to mark notifications as read');
            }
        })
        .catch(error => {
            console.error('Error marking all as read:', error);
            showToast('Failed to mark all as read', 'error');
        });
});

// Filter options
document.querySelectorAll('.filter-option').forEach(option => {
    option.addEventListener('click', function () {
        // Update active class
        document.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
        this.classList.add('active');

        // Get filter type
        const filterType = this.getAttribute('data-filter');

        // Apply filter
        document.querySelectorAll('.notification-item').forEach(item => {
            if (filterType === 'all') {
                item.style.display = '';
            } else if (filterType === 'unread') {
                item.style.display = item.classList.contains('unread') ? '' : 'none';
            } else {
                // Filter by notification type
                const itemType = item.getAttribute('data-notification-type').toLowerCase();
                item.style.display = itemType.includes(filterType) ? '' : 'none';
            }
        });
    });
});