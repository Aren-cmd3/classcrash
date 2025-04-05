
document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    
    // Redirect to login if not logged in
    if (!user) {
        window.location.href = 'index3.html';
    }
    
    // Update cart count
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelector('.cart-count').textContent = cartCount;
    
    // Initialize address storage if it doesn't exist
    if (!localStorage.getItem('userAddresses')) {
        localStorage.setItem('userAddresses', JSON.stringify([]));
    }
    
    // Load saved addresses
    loadAddresses();
    
    // Add click event for the Add New Address button
    document.getElementById('add-address-btn').addEventListener('click', function() {
        showAddressModal();
    });
});

function loadAddresses() {
    const addressesContainer = document.getElementById('saved-addresses');
    const emptyAddressesElement = document.getElementById('empty-addresses');
    const addButton = document.getElementById('add-address-btn');
    
    // Get addresses from localStorage
    const addresses = JSON.parse(localStorage.getItem('userAddresses')) || [];
    
    // Check if we've reached the maximum number of addresses
    if (addresses.length >= 5) {
        addButton.disabled = true;
        addButton.style.opacity = '0.6';
        addButton.style.cursor = 'not-allowed';
    } else {
        addButton.disabled = false;
        addButton.style.opacity = '1';
        addButton.style.cursor = 'pointer';
    }
    
    // Clear previous content except for empty state message
    Array.from(addressesContainer.children).forEach(child => {
        if (child.id !== 'empty-addresses') {
            child.remove();
        }
    });
    
    // Show/hide empty state based on address count
    if (addresses.length === 0) {
        emptyAddressesElement.style.display = 'block';
    } else {
        emptyAddressesElement.style.display = 'none';
        
        // Render each address
        addresses.forEach((address, index) => {
            const addressCard = document.createElement('div');
            addressCard.className = 'address-card';
            
            const labelElement = document.createElement('div');
            labelElement.className = 'address-label';
            
            // Add icon based on label
            const iconClass = getIconForLabel(address.label);
            labelElement.innerHTML = `<i class="${iconClass}"></i> ${address.label || 'Address ' + (index + 1)}`;
            
            // Add default badge if this is the default address
            if (address.isDefault) {
                const defaultBadge = document.createElement('span');
                defaultBadge.className = 'default-badge';
                defaultBadge.textContent = 'Default';
                labelElement.appendChild(defaultBadge);
            }
            
            const detailsElement = document.createElement('div');
            detailsElement.className = 'address-details';
            detailsElement.innerHTML = `
                ${address.address}<br>
                ${address.barangay}, ${address.city}<br>
                ${address.province}, ${address.postalCode}<br>
                ${address.country}
            `;
            
            const actionsMenu = document.createElement('div');
            actionsMenu.className = 'address-actions-menu';
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'address-action-btn';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = 'Edit Address';
            editBtn.addEventListener('click', () => showAddressModal(index));
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'address-action-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.title = 'Delete Address';
            deleteBtn.addEventListener('click', () => deleteAddress(index));
            
            // Set as default button (only if not already default)
            if (!address.isDefault) {
                const defaultBtn = document.createElement('button');
                defaultBtn.className = 'address-action-btn';
                defaultBtn.innerHTML = '<i class="fas fa-star"></i>';
                defaultBtn.title = 'Set as Default';
                defaultBtn.addEventListener('click', () => setAsDefault(index));
                actionsMenu.appendChild(defaultBtn);
            }
            
            actionsMenu.appendChild(editBtn);
            actionsMenu.appendChild(deleteBtn);
            
            addressCard.appendChild(labelElement);
            addressCard.appendChild(detailsElement);
            addressCard.appendChild(actionsMenu);
            
            addressesContainer.appendChild(addressCard);
        });
    }
}

function getIconForLabel(label) {
    if (!label) return 'fas fa-map-marker-alt';
    
    label = label.toLowerCase();
    
    if (label.includes('home')) return 'fas fa-home';
    if (label.includes('office') || label.includes('work')) return 'fas fa-briefcase';
    if (label.includes('school') || label.includes('college')) return 'fas fa-graduation-cap';
    if (label.includes('apartment')) return 'fas fa-building';
    if (label.includes('parent') || label.includes('mom') || label.includes('dad')) return 'fas fa-house-user';
    
    return 'fas fa-map-marker-alt';
}

function showAddressModal(editIndex = -1) {
    // Clone the modal template
    const template = document.getElementById('address-modal-template');
    const modalClone = template.cloneNode(true);
    modalClone.style.display = 'block';
    modalClone.id = 'active-address-modal';
    document.body.appendChild(modalClone);
    
    // Get the modal components
    const modal = modalClone.querySelector('#address-modal');
    const modalTitle = modalClone.querySelector('#modal-title');
    const saveBtn = modalClone.querySelector('#save-address-btn');
    
    // Set up for editing if an index is provided
    if (editIndex >= 0) {
        const addresses = JSON.parse(localStorage.getItem('userAddresses')) || [];
        const addressToEdit = addresses[editIndex];
        
        modalTitle.textContent = 'Edit Address';
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Update Address';
        
        // Fill in the form with existing data
        modalClone.querySelector('#address-label').value = addressToEdit.label || '';
        modalClone.querySelector('#address-line').value = addressToEdit.address || '';
        modalClone.querySelector('#address-barangay').value = addressToEdit.barangay || '';
        modalClone.querySelector('#address-city').value = addressToEdit.city || '';
        modalClone.querySelector('#address-postal').value = addressToEdit.postalCode || '';
        modalClone.querySelector('#address-province').value = addressToEdit.province || '';
        modalClone.querySelector('#address-country').value = addressToEdit.country || 'PHL';
        
        // Adjust input styling for filled fields
        Array.from(modalClone.querySelectorAll('.form-group input')).forEach(input => {
            if (input.value) {
                input.classList.add('filled');
            }
        });
    } else {
        modalTitle.textContent = 'Add New Address';
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Save Address';
    }
    
    // Save button click handler
    saveBtn.addEventListener('click', function() {
        saveAddress(editIndex, modalClone);
    });
    
    // Set up input focus effects
    setupInputEffects(modalClone);
}

function setupInputEffects(modalElement) {
    const inputs = modalElement.querySelectorAll('.form-group input');
    
    inputs.forEach(input => {
        // Initial state
        if (input.value) {
            input.classList.add('filled');
        }
        
        // Focus and blur events
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            } else {
                this.classList.add('filled');
            }
        });
    });
}

function closeAddressModal() {
    const modal = document.getElementById('active-address-modal');
    if (modal) {
        modal.remove();
    }
}

function saveAddress(editIndex, modalElement) {
    // Get form values
    const label = modalElement.querySelector('#address-label').value;
    const address = modalElement.querySelector('#address-line').value;
    const barangay = modalElement.querySelector('#address-barangay').value;
    const city = modalElement.querySelector('#address-city').value;
    const postalCode = modalElement.querySelector('#address-postal').value;
    const province = modalElement.querySelector('#address-province').value;
    const country = modalElement.querySelector('#address-country').value;
    
    // Validate required fields
    if (!address || !barangay || !city || !postalCode || !province) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    // Get existing addresses
    const addresses = JSON.parse(localStorage.getItem('userAddresses')) || [];
    
    // Check if we're at the limit for new address
    if (editIndex === -1 && addresses.length >= 5) {
        showNotification('You can only save up to 5 addresses', 'error');
        return;
    }
    
    // Create address object
    const newAddress = {
        label: label || 'Address ' + (addresses.length + 1),
        address,
        barangay,
        city,
        postalCode,
        province,
        country,
        isDefault: editIndex === -1 && addresses.length === 0 // First address is default
    };
    
    // Update or add address
    if (editIndex >= 0) {
        // Preserve default status when editing
        newAddress.isDefault = addresses[editIndex].isDefault;
        addresses[editIndex] = newAddress;
        showNotification('Address updated successfully');
    } else {
        addresses.push(newAddress);
        showNotification('New address added successfully');
    }
    
    // Save to localStorage
    localStorage.setItem('userAddresses', JSON.stringify(addresses));
    
    // Close modal and reload addresses
    closeAddressModal();
    loadAddresses();
}

function deleteAddress(index) {
    if (confirm('Are you sure you want to delete this address?')) {
        const addresses = JSON.parse(localStorage.getItem('userAddresses')) || [];
        
        // Check if deleting default address
        const isDefault = addresses[index].isDefault;
        
        // Remove the address
        addresses.splice(index, 1);
        
        // If we deleted the default address and there are other addresses,
        // make the first one the new default
        if (isDefault && addresses.length > 0) {
            addresses[0].isDefault = true;
        }
        
        localStorage.setItem('userAddresses', JSON.stringify(addresses));
        loadAddresses();
        showNotification('Address deleted successfully');
    }
}

function setAsDefault(index) {
    const addresses = JSON.parse(localStorage.getItem('userAddresses')) || [];
    
    // Remove default status from all addresses
    addresses.forEach(address => {
        address.isDefault = false;
    });
    
    // Set new default
    addresses[index].isDefault = true;
    
    localStorage.setItem('userAddresses', JSON.stringify(addresses));
    loadAddresses();
    showNotification('Default address updated');
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
