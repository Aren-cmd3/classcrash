document.addEventListener("DOMContentLoaded", function() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    localStorage.setItem('cartCount', cartCount);
    const cartLink = document.getElementById('cart-link');
    cartLink.innerHTML = `CART <span class="cart-count">${cartCount}</span>`;
    let user = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!user) {
        window.location.href = "index3.html"; 
        return;
    }

    // Set default profile data if missing
    if (!user.memberSince) {
        user.memberSince = new Date().toLocaleDateString();
    }
    if (!user.rewardPoints) {
        user.rewardPoints = 0;
    }

    // Calculate order statistics
    const purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
    const totalOrders = purchaseHistory.length;
    const totalSpent = purchaseHistory.reduce((sum, purchase) => sum + purchase.total, 0);

    // Update stats display and add click events
    const statsCards = document.querySelectorAll('.stat-card');

    // Total Orders
    document.querySelectorAll('.stat-card .stat-number')[0].textContent = totalOrders;
    statsCards[0].addEventListener('click', () => showHistoryModal());

    // Total Spent
    document.querySelectorAll('.stat-card .stat-number')[1].textContent = `₱${totalSpent.toFixed(2)}`;
    statsCards[1].addEventListener('click', () => showHistoryModal());

    // Update order status cards
    const orderStatuses = {
        'Processing': 0,
        'In Transit': 0,
        'Delivered': 0,
        'Cancelled': 0
    };

    // Count orders by status
    purchaseHistory.forEach(order => {
        if (orderStatuses.hasOwnProperty(order.orderStatus)) {
            orderStatuses[order.orderStatus]++;
        }
    });

    // Store order status counts in localStorage for use in My Orders page
    localStorage.setItem('orderStatusCounts', JSON.stringify(orderStatuses));

    // Initialize status cards if they exist in DOM
    const toShipElement = document.querySelector('.to-ship .status-number');
    const toReceiveElement = document.querySelector('.to-receive .status-number');
    const toCompleteElement = document.querySelector('.to-complete .status-number');
    const cancelledElement = document.querySelector('.cancelled .status-number');

    // Update status cards with counts if they exist
    if (toShipElement) toShipElement.textContent = orderStatuses['Processing'] || 0;
    if (toReceiveElement) toReceiveElement.textContent = orderStatuses['In Transit'] || 0;
    if (toCompleteElement) toCompleteElement.textContent = orderStatuses['Delivered'] || 0;
    if (cancelledElement) cancelledElement.textContent = orderStatuses['Cancelled'] || 0;

    function showHistoryModal() {
        document.getElementById('history-modal').style.display = 'block';
    }

    function closeHistoryModal() {
        document.getElementById('history-modal').style.display = 'none';
    }

    window.closeHistoryModal = closeHistoryModal;

    // Calculate total reward points from purchase history
    const totalRewardPoints = purchaseHistory.reduce((total, purchase) => {
        return total + (purchase.total * 0.001); // 0.1% reward points per purchase
    }, 0);

    // Update reward points display
    const rewardPointsElement = document.querySelectorAll('.stat-number')[2];
    if (rewardPointsElement) {
        rewardPointsElement.textContent = totalRewardPoints.toFixed(2);
    }

    // Display purchase history
    const purchaseList = document.getElementById('purchase-history-list');
    if (purchaseList) {
        purchaseHistory.reverse().forEach(purchase => {
            purchase.items.forEach(item => {
                const purchaseDate = new Date(purchase.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const purchaseItem = document.createElement('div');
                purchaseItem.className = 'purchase-item';
                const itemPrice = parseFloat(item.price.replace('₱', ''));
                const itemTotal = itemPrice * item.quantity;
                purchaseItem.innerHTML = `
                    <img src="${item.img}" alt="${item.name}" style="width: 100px; height: 100px; object-fit: cover;">
                    <div class="purchase-details">
                        <h3>${item.name}</h3>
                        <p class="purchase-date">${purchaseDate}</p>
                        <p class="purchase-price">Price: ₱${itemPrice.toFixed(2)}</p>
                        <p>Quantity: ${item.quantity}</p>
                        <p class="item-total">Total: ₱${itemTotal.toFixed(2)}</p>
                        <p class="order-status">Status: ${purchase.orderStatus}</p>
                    </div>
                `;
                purchaseList.appendChild(purchaseItem);
            });
        });
    }

    // Set reward points
    if (rewardPointsElement) {
        rewardPointsElement.textContent = `${(user.rewardPoints || 0).toFixed(2)}`;
    }

    let firstName = user.name.split(" ")[0];
    let fullName = user.name;
    let email = user.email;

    // Update user information display
    const userNameElement = document.getElementById("user-name");
    if (userNameElement) {
        userNameElement.textContent = `Welcome, ${firstName}!`;
    }

    // Add user details section
    const userInfoSection = document.createElement('div');
    userInfoSection.className = 'user-info';
    userInfoSection.innerHTML = `
        <p><strong>Full Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Birthday:</strong> ${user.birthday || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
        <p><strong>Account Status:</strong> Active</p>
        <p><strong>Member Since:</strong> ${user.memberSince || new Date().toLocaleDateString()}</p>
        <button id="edit-profile-btn" class="save-btn action-btn">Edit Profile</button>
    `;

    const profileSection = document.querySelector('.profile-section');
    if (profileSection) {
        // Check if user info section already exists and remove it
        const existingUserInfo = profileSection.querySelector('.user-info');
        if (existingUserInfo) {
            existingUserInfo.remove();
        }

        // Insert the new user info section
        profileSection.insertBefore(
            userInfoSection, 
            profileSection.querySelector('.logout-btn')
        );
    }

    // Profile picture functionality
    const profilePic = document.getElementById("profile-pic");
    if (profilePic) {
        if (user.profilePic) {
            profilePic.src = user.profilePic;
        } else {
            // Default profile image if none is set
            profilePic.src = "guest.png";
        }

        // Add animation for profile picture load
        profilePic.onload = function() {
            profilePic.classList.add('profile-loaded');
        };
    }

    // Ensure the file input exists and add event listener
    const profilePicUpload = document.getElementById("profile-pic-upload");
    if (profilePicUpload) {
        profilePicUpload.addEventListener("change", function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validate file size (max 2MB)
                if (file.size > 2 * 1024 * 1024) {
                    alert("Image size should be less than 2MB");
                    return;
                }

                // Validate file type
                const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!validTypes.includes(file.type)) {
                    alert("Only JPG, PNG, GIF and WEBP formats are supported");
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    if (profilePic) {
                        profilePic.src = e.target.result;
                    }
                    user.profilePic = e.target.result;
                    localStorage.setItem("loggedInUser", JSON.stringify(user));

                    // Update profile pic in navbar if exists
                    const dashboardPic = document.getElementById("dashboard-pic");
                    if (dashboardPic) {
                        dashboardPic.src = e.target.result;
                    }

                    // Show success message
                    const notification = document.createElement('div');
                    notification.className = 'profile-update-notification';
                    notification.innerHTML = 'Profile picture updated successfully!';
                    document.body.appendChild(notification);

                    setTimeout(() => {
                        notification.remove();
                    }, 3000);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Profile edit functionality
    // Profile edit button event listener
    setTimeout(function() {
        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', function() {
                showProfileEditModal();
            });
        }
    }, 100);

    function showProfileEditModal() {
        // Remove existing modal if present
        const existingModal = document.getElementById('profile-edit-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal for editing profile
        const modal = document.createElement('div');
        modal.className = 'modal fade-in';
        modal.id = 'profile-edit-modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content slide-up">
                <div class="modal-header">
                    <h2>Edit Profile</h2>
                    <span class="close" onclick="closeProfileEditModal()">&times;</span>
                </div>
                <div class="profile-edit-avatar">
                    <img src="${user.profilePic || 'guest.png'}" alt="Profile Picture">
                    <div class="avatar-overlay" onclick="document.getElementById('profile-pic-upload').click()">
                        <i class="fas fa-camera"></i>
                        <span>Change Photo</span>
                    </div>
                </div>
                <div class="form-groups">
                    <div class="form-group">
                        <input type="text" id="edit-name" value="${user.name}" required>
                        <label for="edit-name">Full Name</label>
                        <span class="form-icon"><i class="fas fa-user"></i></span>
                    </div>
                    <div class="form-group">
                        <input type="email" id="edit-email" value="${user.email}" required>
                        <label for="edit-email">Email</label>
                        <span class="form-icon"><i class="fas fa-envelope"></i></span>
                    </div>
                    <div class="form-group">
                        <input type="text" id="edit-phone" value="${user.phone || ''}">
                        <label for="edit-phone">Phone</label>
                        <span class="form-icon"><i class="fas fa-phone"></i></span>
                    </div>
                    <div class="form-group">
                        <input type="text" id="edit-birthday" value="${user.birthday || ''}">
                        <label for="edit-birthday">Birthday (MM/DD/YYYY)</label>
                        <span class="form-icon"><i class="fas fa-birthday-cake"></i></span>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="cancel-btn" onclick="closeProfileEditModal()">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button type="button" class="save-btn action-btn" onclick="saveProfileChanges()">
                        <i class="fas fa-check"></i> Save Changes
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add classes to inputs with values to keep labels raised
        setTimeout(() => {
            const inputs = modal.querySelectorAll('input');
            inputs.forEach(input => {
                if (input.value) {
                    input.classList.add('has-value');
                    input.parentElement.classList.add('focused');
                }

                input.addEventListener('focus', function() {
                    this.parentElement.classList.add('focused');
                });

                input.addEventListener('blur', function() {
                    if (!this.value) {
                        this.parentElement.classList.remove('focused');
                    } else {
                        this.classList.add('has-value');
                    }
                });
            });
        }, 10);
    }

    window.closeProfileEditModal = function() {
        const modal = document.getElementById('profile-edit-modal');
        if (modal) {
            modal.remove();
        }
    };

    window.saveProfileChanges = function() {
        const name = document.getElementById('edit-name').value;
        const email = document.getElementById('edit-email').value;
        const phone = document.getElementById('edit-phone').value;
        const birthday = document.getElementById('edit-birthday').value;

        // Validate inputs with visual feedback
        const nameInput = document.getElementById('edit-name');
        const emailInput = document.getElementById('edit-email');

        let isValid = true;

        if (!name) {
            nameInput.classList.add('invalid');
            isValid = false;
        } else {
            nameInput.classList.remove('invalid');
        }

        if (!email || !email.includes('@')) {
            emailInput.classList.add('invalid');
            isValid = false;
        } else {
            emailInput.classList.remove('invalid');
        }

        if (!isValid) {
            const errorNotification = document.createElement('div');
            errorNotification.className = 'profile-update-notification error';
            errorNotification.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please fill in all required fields correctly';
            document.body.appendChild(errorNotification);

            setTimeout(() => {
                errorNotification.remove();
            }, 3000);
            return;
        }

        // Show loading indication
        const saveBtn = document.querySelector('.save-btn');
        const originalBtnText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;

        // Update user object
        user.name = name;
        user.email = email;
        user.phone = phone;
        user.birthday = birthday;

        // If user object doesn't have memberSince, add it
        if (!user.memberSince) {
            user.memberSince = new Date().toLocaleDateString();
        }

        // Save to localStorage
        localStorage.setItem('loggedInUser', JSON.stringify(user));

        // Simulate network delay (remove this in production)
        setTimeout(() => {
            // Update display
            const firstName = name.split(" ")[0];
            const userNameElement = document.getElementById("user-name");
            if (userNameElement) {
                userNameElement.textContent = `Welcome, ${firstName}!`;
            }

            // Update dashboard link in header if it exists
            const dashboardLink = document.querySelector("#dashboard-link");
            if (dashboardLink) {
                dashboardLink.textContent = `Hi, ${firstName}`;
            }

            // Show success notification
            const notification = document.createElement('div');
            notification.className = 'profile-update-notification success';
            notification.innerHTML = '<i class="fas fa-check-circle"></i> Profile updated successfully!';
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);

            // Close modal and reload page to reflect changes
            closeProfileEditModal();
            location.reload();
        }, 800);
    };


    // Function to show orders by status
    window.showOrdersByStatus = function(status) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';

        const statusIcons = {
            'Processing': '<i class="fas fa-cog fa-spin"></i>',
            'In Transit': '<i class="fas fa-shipping-fast"></i>',
            'Delivered': '<i class="fas fa-box-open"></i>',
            'Completed': '<i class="fas fa-check-circle"></i>',
            'Cancelled': '<i class="fas fa-times-circle"></i>'
        };

        const statusColors = {
            'Processing': '#ffd700',
            'In Transit': '#1e90ff',
            'Delivered': '#32cd32',
            'Completed': '#228b22',
            'Cancelled': '#dc143c'
        };

        const statusBgColors = {
            'Processing': 'rgba(255, 215, 0, 0.1)',
            'In Transit': 'rgba(30, 144, 255, 0.1)',
            'Delivered': 'rgba(50, 205, 50, 0.1)',
            'Completed': 'rgba(34, 139, 34, 0.1)',
            'Cancelled': 'rgba(220, 20, 60, 0.1)'
        };

        const purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
        const filteredOrders = purchaseHistory.filter(order => order.orderStatus === status);

        let ordersHTML = `
            <div class="modal-content status-view-content">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <div class="status-header" style="color: ${statusColors[status]}; background: ${statusBgColors[status]}; border-radius: 15px; padding: 15px;">
                    ${statusIcons[status]}
                    <h2>${status} Orders</h2>
                </div>
                <div class="filtered-orders">
        `;

        if (filteredOrders.length === 0) {
            ordersHTML += '<p class="no-orders">No orders with this status</p>';
        } else {
            filteredOrders.forEach((order, index) => {
                order.items.forEach(item => {
                    ordersHTML += `
                        <div class="order-item" style="border-left: 4px solid ${statusColors[status]}">
                            <div class="order-item-details">
                                <img src="${item.img}" alt="${item.name}">
                                <div class="order-info">
                                    <h4>#ORD-${String(index + 1).padStart(3, '0')}</h4>
                                    <p>${item.name}</p>
                                    <p>Quantity: ${item.quantity}</p>
                                    <p>Total: ₱${(parseFloat(item.price.replace('₱', '')) * item.quantity).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    `;
                });
            });
        }

        ordersHTML += `
                </div>
            </div>
        `;

        modal.innerHTML = ordersHTML;
        document.body.appendChild(modal);
    };

    // Admin function to process orders
    window.processOrder = function(index) {
        if (!user.isAdmin) return;

        let purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
        if (purchaseHistory[index]) {
            const currentStatus = purchaseHistory[index].orderStatus;
            const statusFlow = {
                'Processing': 'In Transit',
                'In Transit': 'Delivered',
                'Delivered': 'Completed'
            };

            if (statusFlow[currentStatus]) {
                const confirmMessage = `Are you sure you want to update this order from "${currentStatus}" to "${statusFlow[currentStatus]}"?`;
                if (confirm(confirmMessage)) {
                    purchaseHistory[index].orderStatus = statusFlow[currentStatus];
                    localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));

                    // Show success notification
                    const notification = document.createElement('div');
                    notification.className = 'status-update-notification';
                    notification.innerHTML = `Order status updated to: ${statusFlow[currentStatus]}`;
                    document.body.appendChild(notification);

                    setTimeout(() => {
                        notification.remove();
                        location.reload();
                    }, 1500);
                }
            }
        }
    };

window.rejectOrder = function(index) {
        if (!user.isAdmin) return;

        let purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
        if (purchaseHistory[index]) {
            const confirmMessage = "Are you sure you want to reject this order?";
            if (confirm(confirmMessage)) {
                purchaseHistory[index].orderStatus = 'Cancelled';
                localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));

                // Show rejection notification
                const notification = document.createElement('div');
                notification.className = 'status-update-notification rejection';
                notification.innerHTML = `Order has been cancelled`;
                document.body.appendChild(notification);

                setTimeout(() => {
                    notification.remove();
                    location.reload();
                }, 1500);
            }
        }
    };
});

// Define logout function in global scope
window.logout = function() {
    // Only clear login session data
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("cart");
    localStorage.removeItem("cartCount");
    window.location.href = "index3.html";
};

setTimeout(() => {
                showHeaderNotification({
                    title: 'My Orders',
                    message: 'Track and manage all your orders in one place',
                    type: 'info',
                    icon: '📦',
                    duration: 5000
                });

                // Show available promotion code
                setTimeout(() => {
                    showHeaderNotification({
                        title: 'Available Promotion!',
                        message: 'Use code WELCOME10 for 10% off your first order',
                        type: 'success',
                        icon: '🎁',
                        duration: 8000
                    });
                }, 6000);
            }, 1000);