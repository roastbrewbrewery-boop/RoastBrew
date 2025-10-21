// --- API Configuration ---
// Replace with your deployed backend URL when you go live
const API_BASE_URL = 'https://roast-brew-backend.onrender.com'; 

// Helper function for currency formatting (Philippine Peso)
const formatCurrency = (amount) => {
    return `₱ ${parseFloat(amount).toFixed(2)}`;
};

// --- Mobile Navigation ---
const navSlide = () => {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');

    if (!burger || !nav) return;

    burger.addEventListener('click', () => {
        nav.classList.toggle('nav-active');
        navLinks.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = '';
            } else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
            }
        });
        burger.classList.toggle('toggle');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (nav.classList.contains('nav-active')) {
                nav.classList.remove('nav-active');
                burger.classList.remove('toggle');
                navLinks.forEach(item => {
                    item.style.animation = '';
                });
            }
        });
    });
};

// --- Navigation Active Class (for single-page sections) ---
const sections = document.querySelectorAll('section');
const navLi = document.querySelectorAll('.nav-links li a');

const updateActiveNavLink = () => {
    let current = '';
    if (document.body.classList.contains('homepage')) {
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });
    } else if (document.body.classList.contains('shop-page')) {
        current = 'shop';
    } else if (document.body.classList.contains('checkout-page')) {
        current = 'checkout';
    } else if (document.body.classList.contains('track-page')) { // NEW
        current = 'track';
    }

    navLi.forEach(a => {
        a.classList.remove('active');
        if (a.href.includes(current) || (a.href.includes('shop.html') && current === 'shop') || (a.href.includes('checkout.html') && current === 'checkout') || (a.href.includes('track.html') && current === 'track')) { // NEW
            a.classList.add('active');
        }
    });
};


// --- Sign In/Up Modal Functionality ---
const signinModal = document.getElementById('signin-modal');
const closeBtns = document.querySelectorAll('.modal .close-btn');
const signinForm = signinModal ? signinModal.querySelector('.signin-form') : null;
const signupForm = signinModal ? signinModal.querySelector('.signup-form') : null;
const signupLink = signinModal ? document.getElementById('signup-link') : null;
const signinLink = signinModal ? document.getElementById('signin-link') : null;

let userIsSignedIn = localStorage.getItem('userSignedIn') === 'true';
let signedInUserEmail = localStorage.getItem('signedInUserEmail') || '';
let signedInUsername = localStorage.getItem('signedInUsername') || ''; // NEW: Store username

// --- IMPORTANT: Ensure these elements exist in your HTML modals ---
const signupMessageElement = document.getElementById('signup-message'); // For signup modal
const paymentMessageElement = document.getElementById('payment-message'); // For payment modal (you need to add this in checkout.html)

function updateSignInButton() {
    const signinButtonContainer = document.querySelector('.auth-links');
    if (!signinButtonContainer) return;

    if (userIsSignedIn) {
        signinButtonContainer.innerHTML = `
            <a href="#" id="signed-in-user-link"><i class="fas fa-user"></i> ${signedInUsername}</a>
            <a href="#" id="signout-btn" class="signout-btn"><i class="fas fa-sign-out-alt"></i> Sign Out</a>
        `;
        document.getElementById('signout-btn')?.addEventListener('click', signOutUser);
    } else {
        signinButtonContainer.innerHTML = `
            <a href="#" id="signin-btn-all"><i class="fas fa-user"></i> Sign In/Up</a>
        `;
        document.getElementById('signin-btn-all')?.addEventListener('click', openSignInModal);
    }

    // NEW: Update track page display based on sign-in status
    if (document.body.classList.contains('track-page')) {
        updateTrackPageDisplay();
    }
}

function openSignInModal(e) {
    e.preventDefault();
    if (signinModal) {
        signinModal.classList.add('active');
        if (signinForm) signinForm.style.display = 'block';
        if (signupForm) signupForm.style.display = 'none';
        // NEW: Ensure signup message is cleared when opening modal
        const currentSignupMessage = signinModal.querySelector('#signup-message');
        if (currentSignupMessage) {
            currentSignupMessage.textContent = '';
            currentSignupMessage.style.display = 'none'; // Hide it
        }
    }
}

function signOutUser(e) {
    e.preventDefault();
    userIsSignedIn = false;
    signedInUserEmail = '';
    signedInUsername = ''; // NEW: Clear username on sign out
    localStorage.removeItem('userSignedIn');
    localStorage.removeItem('signedInUserEmail');
    localStorage.removeItem('signedInUsername'); // NEW: Clear username from storage
    localStorage.removeItem('breweryCart');
    cart = [];
    updateCartCount();
    updateSignInButton();
    if (document.body.classList.contains('checkout-page')) {
        updateCartDisplay();
    }
    // NEW: Clear tracking results and update track page display if on track page
    if (document.body.classList.contains('track-page')) {
        document.getElementById('tracking-results').style.display = 'none';
        document.getElementById('order-not-found').style.display = 'none';
        updateTrackPageDisplay();
    }
    alert('You have been signed out.');
}


closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.modal').classList.remove('active');
        // NEW: Clear messages when closing modal
        const signupMsg = document.getElementById('signup-message');
        if (signupMsg) signupMsg.textContent = '';
        const paymentMsg = document.getElementById('payment-message');
        if (paymentMsg) paymentMsg.textContent = '';
    });
});


if (signinModal) {
    window.addEventListener('click', (e) => {
        if (e.target == signinModal) {
            signinModal.classList.remove('active');
            // NEW: Clear messages when closing modal by clicking outside
            const signupMsg = document.getElementById('signup-message');
            if (signupMsg) signupMsg.textContent = '';
            const paymentMsg = document.getElementById('payment-message');
            if (paymentMsg) paymentMsg.textContent = '';
        }
    });
}

if (signupLink) {
    signupLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (signinForm) signinForm.style.display = 'none';
        if (signupForm) signupForm.style.display = 'block';
        // NEW: Clear message when switching forms
        const currentSignupMessage = signinModal.querySelector('#signup-message');
        if (currentSignupMessage) {
            currentSignupMessage.textContent = '';
            currentSignupMessage.style.display = 'none'; // Hide it
        }
    });
}

if (signinLink) {
    signinLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (signupForm) signupForm.style.display = 'none';
        if (signinForm) signinForm.style.display = 'block';
        // NEW: Clear message when switching forms
        const currentSignupMessage = signinModal.querySelector('#signup-message');
        if (currentSignupMessage) {
            currentSignupMessage.textContent = '';
            currentSignupMessage.style.display = 'none'; // Hide it
        }
    });
}


if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('username').value;
        const passwordInput = document.getElementById('password').value;
        const currentSigninMessage = signinModal.querySelector('#signup-message'); // Re-use the message element

        if (currentSigninMessage) {
            currentSigninMessage.textContent = 'Signing in...';
            currentSigninMessage.style.color = 'black';
            currentSigninMessage.style.display = 'block';
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email: emailInput, password: passwordInput })
            });

            if (response.ok) {
                // Sign-in successful
                const data = await response.json();
                signedInUserEmail = data.user.email;
                signedInUsername = data.user.fullName;
                userIsSignedIn = true;
                localStorage.setItem('userSignedIn', 'true');
                localStorage.setItem('signedInUserEmail', signedInUserEmail);
                localStorage.setItem('signedInUsername', signedInUsername);
                updateSignInButton();
                signinModal.classList.remove('active');
                if (document.body.classList.contains('checkout-page')) {
                    updateCartDisplay();
                }
                if (document.body.classList.contains('track-page')) {
                    updateTrackPageDisplay();
                }
            } else {
                // Sign-in failed
                const errorData = await response.json().catch(() => ({ message: 'Sign-in failed.' }));
                if (currentSigninMessage) {
                    currentSigninMessage.textContent = errorData.message;
                    currentSigninMessage.style.color = 'red';
                }
            }
        } catch (error) {
            console.error('Sign-in fetch error:', error);
            if (currentSigninMessage) {
                currentSigninMessage.textContent = 'Network error. Could not connect to server.';
                currentSigninMessage.style.color = 'red';
            }
        }
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newFullNameInput = document.getElementById('new-full-name').value;
        const newUsernameInput = document.getElementById('new-username').value; // This is the email
        const newPasswordInput = document.getElementById('new-password').value;
        const confirmPasswordInput = document.getElementById('confirm-password').value;

        const currentSignupMessage = signinModal.querySelector('#signup-message'); // Search within the modal, not the form
        if (!currentSignupMessage) {
            console.error("Signup message element not found.");
            return;
        }
        currentSignupMessage.style.display = 'block'; // Ensure it's visible

        if (!newFullNameInput.trim()) { // NEW: Validate full name
            currentSignupMessage.textContent = 'Please enter your full name.';
            currentSignupMessage.style.color = 'red';
            return;
        }

        if (newPasswordInput !== confirmPasswordInput) {
            currentSignupMessage.textContent = 'Passwords do not match!';
            currentSignupMessage.style.color = 'red';
            return;
        }

        currentSignupMessage.textContent = 'Creating account...';
        currentSignupMessage.style.color = 'black';

        try {
            const response = await fetch(`${API_BASE_URL}/api/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    fullName: newFullNameInput,
                    email: newUsernameInput,
                    password: newPasswordInput
                })
            });

            if (response.ok) {
                // Only parse JSON if the response is successful
                const data = await response.json();

                // Sign-up successful, now log them in
                signedInUserEmail = data.user.email;
                signedInUsername = data.user.fullName;
                userIsSignedIn = true;
                localStorage.setItem('userSignedIn', 'true');
                localStorage.setItem('signedInUserEmail', signedInUserEmail);
                localStorage.setItem('signedInUsername', signedInUsername);
                updateSignInButton();
                signinModal.classList.remove('active');

                if (document.body.classList.contains('checkout-page')) {
                    updateCartDisplay();
                }
                if (document.body.classList.contains('track-page')) {
                    updateTrackPageDisplay();
                }
                alert('Sign-up successful! A welcome email has been sent. Please check your spam folder if you don\'t see it.');

            } else {
                // Handle errors: get the message from the server's JSON response
                const errorData = await response.json().catch(() => ({ message: 'An unexpected server error occurred.' }));
                if (currentSignupMessage) {
                    currentSignupMessage.textContent = errorData.message;
                    currentSignupMessage.style.color = 'red';
                }
            }
        } catch (error) {
            if (currentSignupMessage) {
                currentSignupMessage.textContent = 'Network error. Please check your connection and try again.';
                currentSignupMessage.style.color = 'red';
            }
            console.error('Frontend fetch error for sign-up:', error);
        }
    });
}

// --- Cart Functionality (using localStorage for persistence) ---
let cart = JSON.parse(localStorage.getItem('breweryCart')) || [];

function saveCart() {
    localStorage.setItem('breweryCart', JSON.stringify(cart));
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('[id^="cart-count"]').forEach(span => {
        span.textContent = totalItems;
    });
}

function addToCart(event) {
    const button = event.target;
    const name = button.dataset.name;
    const price = parseFloat(button.dataset.price);
    const img = button.dataset.img;
    const id = Date.now(); // Simple unique ID for each item

    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ id, name, price, img, quantity: 1 });
    }

    saveCart();
    updateCartCount();
    alert(`${name} added to cart!`);
}
function updateCartDisplay() {
    const cartItemsDiv = document.getElementById('cart-items');
    const cartSubtotalSpan = document.getElementById('cart-subtotal');
    const cartShippingSpan = document.getElementById('cart-shipping');
    const cartTotalSpan = document.getElementById('cart-total');
    const proceedToPaymentBtn = document.getElementById('proceed-to-payment-btn');


    if (!cartItemsDiv) return;

    cartItemsDiv.innerHTML = '';
    let subtotal = 0;
    const shippingCost = 50.00;

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
        if (cartSubtotalSpan) cartSubtotalSpan.textContent = formatCurrency(0);
        if (cartShippingSpan) cartShippingSpan.textContent = formatCurrency(0);
        if (cartTotalSpan) cartTotalSpan.textContent = formatCurrency(0);
        if (proceedToPaymentBtn) proceedToPaymentBtn.disabled = true;
        updateCartCount();
        return;
    }

    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.innerHTML = `
            <div class="cart-item-details">
                <img src="${item.img}" alt="${item.name}" loading="lazy">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span>${formatCurrency(item.price)} x ${item.quantity}</span>
                </div>
            </div>
            <div class="cart-item-actions">
                <input type="number" value="${item.quantity}" min="1" data-id="${item.id}" class="quantity-input">
                <button class="remove-btn" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        cartItemsDiv.appendChild(itemElement);
        subtotal += item.price * item.quantity;
    });

    const total = subtotal + shippingCost;

    if (cartSubtotalSpan) cartSubtotalSpan.textContent = formatCurrency(subtotal);
    if (cartShippingSpan) cartShippingSpan.textContent = formatCurrency(shippingCost);
    if (cartTotalSpan) cartTotalSpan.textContent = formatCurrency(total);
    if (proceedToPaymentBtn) proceedToPaymentBtn.disabled = false;
    updateCartCount();

    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const itemId = parseInt(e.target.dataset.id);
            const newQuantity = parseInt(e.target.value);
            const item = cart.find(i => i.id === itemId);
            if (item && newQuantity > 0) {
                item.quantity = newQuantity;
            } else if (newQuantity <= 0) {
                cart = cart.filter(i => i.id !== itemId);
            }
            saveCart();
            updateCartDisplay();
        });
    });

    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemId = parseInt(e.currentTarget.dataset.id);
            cart = cart.filter(item => item.id !== itemId);
            saveCart();
            updateCartDisplay();
        });
    });
}

// --- Payment Modal Logic ---
const paymentModal = document.getElementById('payment-modal');
const proceedToPaymentBtn = document.getElementById('proceed-to-payment-btn');
const paymentForm = document.getElementById('payment-form');
const modalSubtotalSpan = document.getElementById('modal-subtotal'); // NEW
const modalShippingSpan = document.getElementById('modal-shipping'); // NEW
const modalOrderTotalSpan = document.getElementById('modal-order-total');
const orderConfirmationMessage = document.querySelector('.order-confirmation-message');
const downloadReceiptBtn = document.getElementById('download-receipt-btn');

// NEW: Function to handle payment method selection
function handlePaymentMethodChange() {
    const paymentMethodRadios = document.querySelectorAll('input[name="payment-method"]');
    const ecashDetails = document.getElementById('ecash-details');
    const cardDetails = document.getElementById('card-details');
    const ecashNumberInput = document.getElementById('ecash-number');
    const cardNumberInput = document.getElementById('card-number');
    const expiryDateInput = document.getElementById('expiry-date');
    const cvvInput = document.getElementById('cvv');

    if (ecashDetails) ecashDetails.style.display = 'none';
    if (cardDetails) cardDetails.style.display = 'none';

    // Remove required attributes when hidden
    if (ecashNumberInput) ecashNumberInput.removeAttribute('required');
    if (cardNumberInput) cardNumberInput.removeAttribute('required');
    if (expiryDateInput) expiryDateInput.removeAttribute('required');
    if (cvvInput) cvvInput.removeAttribute('required');

    const selectedMethod = document.querySelector('input[name="payment-method"]:checked')?.value;

    if (selectedMethod === 'E-Cash') {
        if (ecashDetails) ecashDetails.style.display = 'block';
        if (ecashNumberInput) ecashNumberInput.setAttribute('required', 'true');
    } else if (selectedMethod === 'Card') {
        if (cardDetails) cardDetails.style.display = 'block';
        if (cardNumberInput) cardNumberInput.setAttribute('required', 'true');
        if (expiryDateInput) expiryDateInput.setAttribute('required', 'true');
        if (cvvInput) cvvInput.setAttribute('required', 'true');
    }
}

// Add event listeners for payment method changes
document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
    radio.addEventListener('change', handlePaymentMethodChange);
});


if (proceedToPaymentBtn) {
    proceedToPaymentBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!userIsSignedIn) {
            alert('Please sign in or sign up before proceeding to payment.');
            const currentSigninBtn = document.getElementById('signin-btn-all');
            if (currentSigninBtn) {
                currentSigninBtn.click();
            }
            return;
        }
        if (cart.length === 0) {
            alert('Your cart is empty. Please add items before proceeding to payment.');
            return;
        }

        let subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shippingCost = 50.00;
        const total = subtotal + shippingCost;

        if (modalSubtotalSpan) modalSubtotalSpan.textContent = formatCurrency(subtotal); // NEW
        if (modalShippingSpan) modalShippingSpan.textContent = formatCurrency(shippingCost); // NEW
        if (modalOrderTotalSpan) modalOrderTotalSpan.textContent = formatCurrency(total);

        localStorage.setItem('lastOrderItemsForReceipt', JSON.stringify(cart));

        if (paymentModal) paymentModal.classList.add('active');
        if (paymentForm) paymentForm.style.display = 'flex';
        if (orderConfirmationMessage) orderConfirmationMessage.style.display = 'none';
        if (paymentMessageElement) { // Clear message when modal opens
            paymentMessageElement.textContent = '';
            paymentMessageElement.style.display = 'none'; // Hide message initially
        }
        handlePaymentMethodChange(); // NEW: Initialize payment details display
    });
}

if (paymentForm) {
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const requiredInputs = paymentForm.querySelectorAll('[required]');
        let allFieldsFilled = true;
        requiredInputs.forEach(input => {
            if (input.type === 'radio') {
                // Radio buttons are handled by checking paymentMethodSelected
                return;
            }
            if (!input.value.trim()) {
                allFieldsFilled = false;
                input.style.borderColor = 'red';
            } else {
                input.style.borderColor = '';
            }
        });

        const paymentMethodSelected = paymentForm.querySelector('input[name="payment-method"]:checked');
        if (!paymentMethodSelected) {
            allFieldsFilled = false;
            // No alert here, will use paymentMessageElement
        }

        if (!allFieldsFilled) {
            if (paymentMessageElement) {
                paymentMessageElement.textContent = 'Please fill in all required shipping and payment information.';
                paymentMessageElement.style.color = 'red';
                paymentMessageElement.style.display = 'block';
            }
            return;
        }

        if (paymentMessageElement) {
            paymentMessageElement.textContent = 'Processing order and sending confirmation email...';
            paymentMessageElement.style.color = 'black';
            paymentMessageElement.style.display = 'block';
        }

        const shippingInfo = {
            fullName: document.getElementById('p-full-name')?.value,
            addressLine1: document.getElementById('p-address-line1')?.value,
            addressLine2: document.getElementById('p-address-line2')?.value,
            city: document.getElementById('p-city')?.value,
            state: document.getElementById('p-state')?.value,
            zip: document.getElementById('p-zip')?.value,
            country: document.getElementById('p-country')?.value,
        };
        const paymentMethod = paymentMethodSelected ? paymentMethodSelected.value : 'N/A';
        const orderItems = JSON.parse(localStorage.getItem('lastOrderItemsForReceipt')) || [];
        let subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shippingCost = 50.00;
        const total = subtotal + shippingCost;
        const orderId = `RAB-${Date.now().toString().slice(-6)}`; // Shorter simulated ID

        // Data to be sent to Formspree
        const orderDetailsForFormspree = {
            _subject: `New Order from Roast & Brew - ID: ${orderId}`, // Email subject
            customerEmail: signedInUserEmail,
            orderId: orderId, // Directly include orderId at top level for easier parsing
            items: orderItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            subtotalAmount: subtotal, // Send raw number
            shippingCostAmount: shippingCost, // Send raw number
            totalAmount: total, // Send raw number
            shippingAddress: shippingInfo,
            paymentMethod: paymentMethod
        };

        try {
            // --- Formspree integration for order confirmation email ---
            const response = await fetch(`${API_BASE_URL}/api/send-order-confirmation-email`, { // UPDATED: Use local backend
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(orderDetailsForFormspree), // Send the JSON object
            });

            if (response.ok || response.status === 200 || response.status === 204) {
                const data = await response.json().catch(() => ({})); // Handle cases where Formspree might return empty response

                if (paymentForm) paymentForm.style.display = 'none';
                if (orderConfirmationMessage) orderConfirmationMessage.style.display = 'block';

                // Store order details in local storage for tracking purposes
                const pastOrders = JSON.parse(localStorage.getItem('userPastOrders')) || [];
                pastOrders.unshift({ // Add to the beginning for most recent first
                    id: orderId,
                    email: signedInUserEmail,
                    date: new Date().toISOString(),
                    total: total,
                    status: 'Order Placed' // Initial status
                });
                localStorage.setItem('userPastOrders', JSON.stringify(pastOrders));

                // NEW: Store shipping info for receipt download
                localStorage.setItem('lastOrderShippingInfo', JSON.stringify(shippingInfo));

                // NEW: Store payment method for receipt download
                localStorage.setItem('lastOrderPaymentMethod', paymentMethod);

                cart = [];
                saveCart();
                updateCartCount();
                if (document.body.classList.contains('checkout-page')) {
                    updateCartDisplay();
                }

                if (paymentMessageElement) {
                    paymentMessageElement.textContent = `Order ${orderId} confirmed! Check your email (and spam folder).`;
                    paymentMessageElement.style.color = 'green';
                }
                alert(`Order Confirmed! A confirmation for order ${orderId} has been sent. Please check your spam folder if you don't see it.`);

            } else {
                const errorData = await response.json().catch(() => ({ message: 'Unknown server error' }));
                if (paymentMessageElement) {
                    paymentMessageElement.textContent = `Order failed: ${errorData.message || 'Could not connect to the server.'}`;
                    paymentMessageElement.style.color = 'red';
                }
                console.error('Server error during order confirmation:', errorData);
                alert(`Order failed: ${errorData.message || 'Server error.'}`);
            }
        } catch (error) {
            if (paymentMessageElement) {
                paymentMessageElement.textContent = 'Network error. Please check your connection and try again.';
                paymentMessageElement.style.color = 'red';
            }
            console.error('Frontend fetch error for order confirmation (Formspree):', error);
            alert('Order failed due to a network error. Please check your connection.');
        }
    });
}

if (downloadReceiptBtn) {
    downloadReceiptBtn.addEventListener('click', async () => {
        let subtotal = 0;
        let shippingCost = 0;
        const itemsForReceipt = JSON.parse(localStorage.getItem('lastOrderItemsForReceipt')) || [];
 
        if (itemsForReceipt.length > 0) {
            subtotal = itemsForReceipt.reduce((sum, item) => sum + item.price * item.quantity, 0);
            shippingCost = 50.00;
        } else {
            subtotal = parseFloat(document.getElementById('cart-subtotal')?.textContent.replace('₱ ', '') || '0');
            shippingCost = parseFloat(document.getElementById('cart-shipping')?.textContent.replace('₱ ', '') || '0');
        }
        const total = subtotal + shippingCost;
 
        // NEW: Retrieve shipping info from localStorage for reliability
        const shippingInfo = JSON.parse(localStorage.getItem('lastOrderShippingInfo')) || {};
        const fullName = shippingInfo.fullName || 'N/A';
        const addressLine1 = shippingInfo.addressLine1 || 'N/A';
        const addressLine2 = shippingInfo.addressLine2 || '';
        const city = shippingInfo.city || 'N/A';
        const state = shippingInfo.state || 'N/A';
        const zip = shippingInfo.zip || 'N/A';
        const country = shippingInfo.country || 'N/A';

        const paymentMethod = localStorage.getItem('lastOrderPaymentMethod') || 'Cash on Delivery';
 
        const receiptContainer = document.getElementById('receipt-container');
        if (!receiptContainer) return;
 
        // Populate the hidden receipt template with order data
        receiptContainer.innerHTML = `
            <h2 style="text-align: center; margin: 0 0 10px 0;">Roast & Brew Brewery</h2>
            <p style="text-align: center; margin: 0; font-size: 12px;">Official Receipt</p>
            <hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;">
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Email:</strong> ${signedInUserEmail || 'N/A'}</p>
            <hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;">
            <h3 style="margin: 15px 0 5px 0;">Items:</h3>
            ${itemsForReceipt.map(item => `<p>${item.name} (x${item.quantity}) - <strong>${formatCurrency(item.price * item.quantity)}</strong></p>`).join('')}
            <hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;">
            <p><strong>Subtotal:</strong> ${formatCurrency(subtotal)}</p>
            <p><strong>Shipping:</strong> ${formatCurrency(shippingCost)}</p>
            <h3 style="margin-top: 10px;">Total: ${formatCurrency(total)}</h3>
            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
            <hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;">
            <h3 style="margin: 15px 0 5px 0;">Shipping To:</h3>
            <p>${fullName}<br>${addressLine1}<br>${addressLine2 ? addressLine2 + '<br>' : ''}${city}, ${state} ${zip}<br>${country}</p>
            <hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;">
            <p style="text-align: center; margin-top: 20px;">Thank you for your purchase!</p>
        `;
 
        // Use html2canvas to generate the image
        const canvas = await html2canvas(receiptContainer);
        const dataUrl = canvas.toDataURL('image/png');
 
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'RoastAndBrew_Receipt.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        alert('Receipt downloaded!');
        if (paymentModal) paymentModal.classList.remove('active');
        localStorage.removeItem('lastOrderItemsForReceipt');
        localStorage.removeItem('lastOrderShippingInfo'); // NEW: Clean up shipping info
        localStorage.removeItem('lastOrderPaymentMethod'); // NEW: Clean up payment method
    });
}


// --- Age Gate Modal ---
const ageGateModal = document.getElementById('age-gate-modal');
const ageConfirmBtn = document.getElementById('age-confirm-btn');
const ageDenyBtn = document.getElementById('age-deny-btn');

const AGE_VERIFIED_KEY = 'breweryAgeVerified';
const AGE_VERIFIED_EXPIRY_KEY = 'breweryAgeVerifiedExpiry';
const VERIFICATION_DURATION_MS = 24 * 60 * 60 * 1000;

function checkAgeVerification() {
    if (!ageGateModal) {
        return;
    }

    const isVerified = localStorage.getItem(AGE_VERIFIED_KEY) === 'true';
    const expiryTime = localStorage.getItem(AGE_VERIFIED_EXPIRY_KEY);
    const currentTime = new Date().getTime();

    if (isVerified && expiryTime && currentTime < parseInt(expiryTime)) {
        ageGateModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    } else {
        ageGateModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

if (ageConfirmBtn) {
    ageConfirmBtn.addEventListener('click', () => {
        localStorage.setItem(AGE_VERIFIED_KEY, 'true');
        localStorage.setItem(AGE_VERIFIED_EXPIRY_KEY, new Date().getTime() + VERIFICATION_DURATION_MS);
        if (ageGateModal) ageGateModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
}

if (ageDenyBtn) {
    ageDenyBtn.addEventListener('click', () => {
        alert('You must be of legal drinking age to access this site. Redirecting...');
        window.location.href = 'https://www.google.com';
    });
}

// --- NEW: Order Tracking Specific Functions ---
const guestTrackingForm = document.getElementById('guest-tracking-form');
const userOrdersContainer = document.getElementById('user-orders-container');
const trackOrderForm = document.getElementById('track-order-form');
const orderIdInput = document.getElementById('order-id');
const trackingResultsDiv = document.getElementById('tracking-results');
const trackedOrderIdSpan = document.getElementById('tracked-order-id');
const orderNotFoundDiv = document.getElementById('order-not-found');

const statusPlacedDateSpan = document.getElementById('status-placed-date');
const statusProcessingDateSpan = document.getElementById('status-processing-date');
const statusDeliveryDateSpan = document.getElementById('status-delivery-date');
const statusDeliveredDateSpan = document.getElementById('status-delivered-date');
const currentStatusText = document.getElementById('current-status-text');
const estimatedDeliveryDate = document.getElementById('estimated-delivery-date');

const statusItems = {
    'Order Placed': document.getElementById('status-placed'),
    'Processing Brews': document.getElementById('status-processing'),
    'Out for Delivery': document.getElementById('status-delivery'),
    'Delivered': document.getElementById('status-delivered')
};

const statusOrder = ['Order Placed', 'Processing Brews', 'Out for Delivery', 'Delivered'];

function getSimulatedOrderDates(orderDateStr, currentStatus) {
    const orderDate = new Date(orderDateStr); // The date the order was placed
    const dates = { 'Order Placed': orderDate.toLocaleDateString() };
    const baseDelay = 1; // Base delay in days for each step

    // Calculate subsequent dates based on the original order date
    const processingDate = new Date(orderDate);
    processingDate.setDate(orderDate.getDate() + baseDelay);
    dates['Processing Brews'] = processingDate.toLocaleDateString();

    const deliveryDate = new Date(processingDate);
    deliveryDate.setDate(processingDate.getDate() + baseDelay + Math.floor(Math.random() * 2)); // 1-2 days after processing
    dates['Out for Delivery'] = deliveryDate.toLocaleDateString();

    const deliveredDate = new Date(deliveryDate);
    deliveredDate.setDate(deliveryDate.getDate() + baseDelay); // 1 day after out for delivery
    dates['Delivered'] = deliveredDate.toLocaleDateString();

    // Estimated delivery is the final 'Delivered' date
    const estimated = deliveredDate.toLocaleDateString();

    return { dates, estimated };
}


async function displayTrackingStatus(orderId, orderEmail = null) {
    // Clear previous results
    trackingResultsDiv.style.display = 'none';
    orderNotFoundDiv.style.display = 'none';
    Object.values(statusItems).forEach(item => {
        item.classList.remove('active');
        item.querySelector('strong').textContent = '';
    });

    let order = null;

    try {
        const response = await fetch(`${API_BASE_URL}/api/track-order/${orderId}`);
        if (response.ok) {
            order = await response.json();
            // If tracking as a signed-in user, ensure the order belongs to them
            if (orderEmail && order.email !== orderEmail) {
                order = null; // Don't show order if it doesn't belong to the signed-in user
            }
        }
    } catch (error) {
        console.error('Error fetching order status:', error);
        orderNotFoundDiv.style.display = 'block';
        return;
    }

    if (order) {
        trackedOrderIdSpan.textContent = order.id;

        const { dates, estimated } = getSimulatedOrderDates(order.date, order.status);

        statusPlacedDateSpan.textContent = dates['Order Placed'];
        statusProcessingDateSpan.textContent = dates['Processing Brews'];
        statusDeliveryDateSpan.textContent = dates['Out for Delivery'];
        statusDeliveredDateSpan.textContent = dates['Delivered'];
        estimatedDeliveryDate.textContent = estimated;

        let currentStatusIndex = statusOrder.indexOf(order.status);
        if (currentStatusIndex === -1) currentStatusIndex = 0; // Default to 'Order Placed' if status is unknown

        for (let i = 0; i <= currentStatusIndex; i++) {
            const statusKey = statusOrder[i];
            if (statusItems[statusKey]) {
                statusItems[statusKey].classList.add('active');
            }
        }
        currentStatusText.textContent = order.status;
        trackingResultsDiv.style.display = 'block';
    } else {
        orderNotFoundDiv.style.display = 'block';
    }
}


if (trackOrderForm) {
    trackOrderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const orderId = orderIdInput.value.trim();
        if (orderId) {
            displayTrackingStatus(orderId); // Call the async function
        } else {
            alert('Please enter an Order ID.');
        }
    });
}

function displayUserOrders() {
    const userOrderListDiv = document.getElementById('user-order-list');
    if (!userOrderListDiv) return;

    userOrderListDiv.innerHTML = '<p>Loading your orders...</p>';

    // Use the new dedicated endpoint for fetching user orders
    fetch(`${API_BASE_URL}/api/my-orders/${encodeURIComponent(signedInUserEmail)}`)
        .then(response => response.json())
        .then(userOrders => {
            if (userOrders.length > 0) {
                userOrderListDiv.innerHTML = ''; // Clear loading message
                userOrders.forEach(order => {
                    const orderDate = new Date(order.date).toLocaleDateString();
                    const orderElement = document.createElement('div');
                    orderElement.classList.add('user-order-item'); // Add a class for styling
                    orderElement.innerHTML = `
                <p><strong>Order ID:</strong> ${order.id}</p>
                <p><strong>Date:</strong> ${orderDate}</p>
                <p><strong>Total:</strong> ${formatCurrency(order.total)}</p> 
                <p><strong>Status:</strong> ${order.status}</p>
                <button class="btn track-specific-order-btn" data-order-id="${order.id}" data-order-email="${signedInUserEmail}">Track</button>
                <hr>
            `;
                    userOrderListDiv.appendChild(orderElement);
                });
    
                document.querySelectorAll('.track-specific-order-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const orderId = e.target.dataset.orderId;
                        const orderEmail = e.target.dataset.orderEmail;
                        displayTrackingStatus(orderId, orderEmail);
                        // Scroll to the tracking results after a short delay to ensure it's visible
                        setTimeout(() => {
                            window.scrollTo({ top: trackingResultsDiv.offsetTop - 100, behavior: 'smooth' });
                        }, 100);
                    });
                });
            } else {
                userOrderListDiv.innerHTML = '<p>You have no past orders.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching user orders:', error);
            userOrderListDiv.innerHTML = '<p style="color: red;">Could not load your orders. Please try again later.</p>';
        });
}

function updateTrackPageDisplay() {
    if (!document.body.classList.contains('track-page')) return;

    if (userIsSignedIn) {
        if (guestTrackingForm) guestTrackingForm.style.display = 'none';
        if (userOrdersContainer) {
            userOrdersContainer.style.display = 'block';
            displayUserOrders(); // Load user-specific orders
        }
    } else {
        if (guestTrackingForm) guestTrackingForm.style.display = 'block';
        if (userOrdersContainer) userOrdersContainer.style.display = 'none';
        // Clear any previous tracking results when user signs out
        if (trackingResultsDiv) trackingResultsDiv.style.display = 'none';
        if (orderNotFoundDiv) orderNotFoundDiv.style.display = 'none';
    }
}

// --- NEW: Contact Form Submission ---
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = contactForm.querySelector('input[placeholder="Your Name"]');
        const emailInput = contactForm.querySelector('input[placeholder="Your Email"]');
        const messageInput = contactForm.querySelector('textarea');
        const submitButton = contactForm.querySelector('button[type="submit"]');

        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/api/contact-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: nameInput.value,
                    email: emailInput.value,
                    message: messageInput.value
                })
            });
            const result = await response.json();
            alert(result.message + " An auto-reply has been sent to your email. Please check your spam folder if you don't see it.");
            if (response.ok) {
                contactForm.reset();
            }
        } catch (error) {
            alert('An error occurred. Please try again later.');
        } finally {
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    });
}

// --- Initialize all functionality ---
document.addEventListener('DOMContentLoaded', () => {
    checkAgeVerification();

    navSlide();
    updateSignInButton();
    updateCartCount();

    // Attach event listeners for Add to Cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', addToCart);
    });

    if (document.getElementById('checkout-details')) {
        updateCartDisplay();
    }

    if (document.body.classList.contains('homepage')) {
        window.addEventListener('scroll', updateActiveNavLink);
    }
    updateActiveNavLink();

    // NEW: Initialize track page display on load
    if (document.body.classList.contains('track-page')) {
        updateTrackPageDisplay();
    }
});
