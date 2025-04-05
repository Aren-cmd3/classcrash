// Global notification counter and notifications list from localStorage
let notificationCount = parseInt(localStorage.getItem('notificationCount') || '0');
const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');

// Get viewed notifications from localStorage
const viewedNotifications = JSON.parse(localStorage.getItem('viewedNotifications') || '{}');

// Store promotional codes
const promotionCodes = [
  { code: 'WELCOME10', discount: '10% off your first order', expiryDate: '2025-12-31' },
  { code: 'STUDENT20', discount: '20% off for students', expiryDate: '2025-06-30' },
  { code: 'FREESHIP', discount: 'Free shipping on orders over ₱1000', expiryDate: '2025-12-31' }
];

// Order status updates
function checkOrderUpdates() {
  const purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
  const lastCheckedOrderStatus = JSON.parse(localStorage.getItem('lastCheckedOrderStatus')) || {};

  let updatedOrders = false;

  purchaseHistory.forEach((purchase, index) => {
    const orderId = `order-${index}`;
    if (lastCheckedOrderStatus[orderId] !== purchase.orderStatus) {
      // Order status has changed
      showHeaderNotification({
        title: `Order Update!`,
        message: `Your order #${index + 1} status changed to: ${purchase.orderStatus}`,
        type: 'info',
        icon: '📦',
        duration: 8000,
        persistentAcrossPages: true
      });

      lastCheckedOrderStatus[orderId] = purchase.orderStatus;
      updatedOrders = true;
    }
  });

  if (updatedOrders) {
    localStorage.setItem('lastCheckedOrderStatus', JSON.stringify(lastCheckedOrderStatus));
  }

  // Show a random promotion every 5 minutes if user is logged in
  if (localStorage.getItem('loggedInUser') && Math.random() > 0.7) {
    const randomPromo = promotionCodes[Math.floor(Math.random() * promotionCodes.length)];
    showHeaderNotification({
      title: 'Special Offer!',
      message: `Use code ${randomPromo.code}: ${randomPromo.discount}. Valid until ${new Date(randomPromo.expiryDate).toLocaleDateString()}`,
      type: 'success',
      icon: '🎁',
      duration: 10000,
      persistentAcrossPages: true
    });
  }
}

// Check for updates when page loads
document.addEventListener('DOMContentLoaded', function() {
  initNotificationSystem();

  // Check for order updates
  setTimeout(checkOrderUpdates, 2000);

  // Periodically check for updates (every 5 minutes)
  setInterval(checkOrderUpdates, 300000);
});

// Function to check if notification was already viewed
function wasNotificationViewed(notification) {
    // Create a unique ID for this notification
    const notificationId = `${notification.title}-${notification.message}`.replace(/\s+/g, '-');
    return viewedNotifications[notificationId] === true;
}

// Function to mark notification as viewed
function markNotificationAsViewed(notification) {
    const notificationId = `${notification.title}-${notification.message}`.replace(/\s+/g, '-');
    viewedNotifications[notificationId] = true;
    localStorage.setItem('viewedNotifications', JSON.stringify(viewedNotifications));
}

// Function to show header notification
function showHeaderNotification(options) {
    const defaults = {
        title: 'Notification',
        message: 'This is a notification message',
        type: 'default', // default, success, error, warning, info
        icon: '🔔',
        duration: 5000,
        closable: true,
        progress: true,
        persistentAcrossPages: true // whether to track this notification across page loads
    };

    const settings = { ...defaults, ...options };

    // Skip if this notification was already viewed (for persistent notifications)
    if (settings.persistentAcrossPages && wasNotificationViewed(settings)) {
        return null;
    }

    // Mark as viewed if persistent
    if (settings.persistentAcrossPages) {
        markNotificationAsViewed(settings);
    }

    // Special tracking for voucher offers
    if (settings.title && settings.title.includes('Special Offer!')) {
        if(sessionStorage.getItem('voucherOfferShown') === 'true'){
            return null;
        }
        sessionStorage.setItem('voucherOfferShown', 'true');
    }

    notificationCount++;
    localStorage.setItem('notificationCount', notificationCount);

    // Create container if it doesn't exist
    let container = document.querySelector('.header-notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'header-notification-container';
        document.body.appendChild(container);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `header-notification ${settings.type}`;
    notification.innerHTML = `
        <div class="header-notification-content">
            <div class="header-notification-icon">${settings.icon}</div>
            <div>
                <h4 class="header-notification-title">${settings.title}</h4>
                <p class="header-notification-message">${settings.message}</p>
            </div>
            ${settings.closable ? '<span class="header-notification-close">&times;</span>' : ''}
            ${settings.progress ? '<div class="header-notification-progress"></div>' : ''}
        </div>
    `;

    // Add to container
    container.appendChild(notification);

    // Add to notifications list for panel
    const notificationData = {
        id: Date.now(),
        title: settings.title,
        message: settings.message,
        type: settings.type,
        icon: settings.icon,
        timestamp: new Date().toLocaleTimeString()
    };
    notifications.unshift(notificationData);
    updateNotificationButton();
    updateNotificationsPanel();

    // Show after a small delay to trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Set up auto-close
    if (settings.duration > 0) {
        const progress = notification.querySelector('.header-notification-progress');
        if (progress) {
            progress.style.animation = `progress ${settings.duration/1000}s linear forwards`;
        }

        setTimeout(() => {
            closeNotification(notification);
        }, settings.duration);
    }

    // Set up close button
    const closeBtn = notification.querySelector('.header-notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeNotification(notification);
        });
    }

    // Return notification for further manipulation
    return notification;
}

// Function to close a notification
function closeNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 400);
}

// Initialize notification button and panel
function initNotificationSystem() {
    // Create notification button if it doesn't exist
    if (!document.querySelector('.notification-button')) {
        const notificationBtn = document.createElement('button');
        notificationBtn.className = 'notification-button';
        notificationBtn.innerHTML = `
            <i class="fas fa-bell"></i>
            <span class="notification-badge">0</span>
        `;
        document.body.appendChild(notificationBtn);

        notificationBtn.addEventListener('click', toggleNotificationsPanel);
    }

    // Create notifications panel
    if (!document.querySelector('.notifications-panel')) {
        const panel = document.createElement('div');
        panel.className = 'notifications-panel';
        panel.innerHTML = `
            <div class="notifications-header">
                <h3>Notifications</h3>
                <button class="notifications-clear">Clear All</button>
            </div>
            <div class="notifications-list">
                <div class="no-notifications">No notifications yet</div>
            </div>
        `;
        document.body.appendChild(panel);

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'notification-overlay';
        document.body.appendChild(overlay);

        // Add event listeners
        panel.querySelector('.notifications-clear').addEventListener('click', clearAllNotifications);
        overlay.addEventListener('click', closeNotificationsPanel);
    }

    // Update badge and notifications list
    updateNotificationButton();
    updateNotificationsPanel();
}

// Function to toggle notifications panel
function toggleNotificationsPanel() {
    const panel = document.querySelector('.notifications-panel');
    const overlay = document.querySelector('.notification-overlay');

    if (panel.classList.contains('show')) {
        closeNotificationsPanel();
    } else {
        panel.classList.add('show');
        overlay.classList.add('show');
    }
}

// Function to close notifications panel
function closeNotificationsPanel() {
    const panel = document.querySelector('.notifications-panel');
    const overlay = document.querySelector('.notification-overlay');

    panel.classList.remove('show');
    overlay.classList.remove('show');
}

// Function to clear all notifications
function clearAllNotifications() {
    notifications.length = 0;
    updateNotificationButton();
    updateNotificationsPanel();

    // Clear notifications from localStorage
    localStorage.setItem('notificationCount', '0');
    localStorage.setItem('notifications', '[]');
}

// Function to update notification button
function updateNotificationButton() {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        badge.textContent = notifications.length;

        // Save notification count and notifications to localStorage
        localStorage.setItem('notificationCount', notifications.length);
        localStorage.setItem('notifications', JSON.stringify(notifications));

        const button = document.querySelector('.notification-button');
        if (notifications.length > 0) {
            button.classList.add('pulse');
        } else {
            button.classList.remove('pulse');
        }
    }
}

// Function to update notifications panel
function updateNotificationsPanel() {
    const notificationsList = document.querySelector('.notifications-list');
    if (notificationsList) {
        if (notifications.length === 0) {
            notificationsList.innerHTML = '<div class="no-notifications">No notifications yet</div>';
        } else {
            notificationsList.innerHTML = '';
            notifications.forEach(notification => {
                const item = document.createElement('div');
                item.className = `notification-item ${notification.type}`;
                item.innerHTML = `
                    <div class="notification-item-icon">${notification.icon}</div>
                    <div class="notification-item-content">
                        <h4>${notification.title}</h4>
                        <p>${notification.message}</p>
                        <small>${notification.timestamp}</small>
                    </div>
                `;
                notificationsList.appendChild(item);
            });
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initNotificationSystem);

// Examples of using the notification system:
// showHeaderNotification({ title: 'Success!', message: 'Item added to cart', type: 'success', icon: '✓' });
// showHeaderNotification({ title: 'Error!', message: 'Something went wrong', type: 'error', icon: '⚠️' });
// showHeaderNotification({ title: 'Warning!', message: 'Low stock available', type: 'warning', icon: '⚠️' });
// showHeaderNotification({ title: 'Info', message: 'New products available', type: 'info', icon: 'ℹ️' });