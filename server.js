const express = require('express');
const cors = require('cors');
const app = express();
// Use the port provided by the environment (e.g., Render) or a default for local development
const port = process.env.PORT || 57935;
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const saltRounds = 10; // For password hashing

app.use(cors());
app.use(express.json());

// --- Nodemailer Transporter Configuration (using Environment Variables) ---
// IMPORTANT: In Render, set EMAIL_USER and EMAIL_PASS in your environment variables.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your email address (e.g., roast.brew.brewery@gmail.com)
        pass: process.env.EMAIL_PASS    // Your 16-digit Google App Password
    }
});

// --- IN-MEMORY DATA STORAGE (Resets on server restart) ---
let storedOrders = []; // This will hold orders placed from the checkout page
let storedUsers = []; // NEW: To store user accounts
let storedMessages = []; // NEW: To store contact form messages
let products = [ // Updated to match the products on the shop page
    { id: 'P001', name: 'Cordillera Stout', stock: 150 },
    { id: 'P002', name: 'Benguet Blond Ale', stock: 200 },
    { id: 'P003', name: 'Sagada Amber', stock: 120 },
    { id: 'P004', name: 'Kalinga Coffee Porter', stock: 180 },
    { id: 'P005', name: 'Apayao Honey Wheat', stock: 160 },
    { id: 'P006', name: 'La Trinidad Strawberry Ale', stock: 100 },
    { id: 'P007', name: 'Ifugao IPA', stock: 130 },
];

// Dynamically calculate monthly sales from stored orders for the admin dashboard
function calculateMonthlySales() {
    const sales = {};
    storedOrders.forEach(order => {
        order.orderDetails.items.forEach(item => {
            if (sales[item.name]) {
                sales[item.name] += item.quantity;
            } else {
                sales[item.name] = item.quantity;
            }
        });
    });
    return sales;
}

// --- API Endpoints for Admin Dashboard ---
app.get('/api/admin/orders', (req, res) => {
    // Transform storedOrders into the format expected by admin.js
    const adminOrders = storedOrders.map(order => ({
        id: order.orderDetails.orderId,
        customerName: order.shippingAddress.fullName, // Use full name from shipping info
        // Combine product names and quantities for the product column
        product: order.orderDetails.items.map(item => `${item.name} (x${item.quantity})`).join(', '),
        quantity: order.orderDetails.items.reduce((sum, item) => sum + item.quantity, 0), // Total quantity of items
        orderDate: order.date, // Use the stored date from the checkout order
        status: order.status // Use the stored status from the checkout order
    }));
    res.json(adminOrders);
});

app.get('/api/admin/products', (req, res) => {
    res.json(products);
});

app.get('/api/admin/sales', (req, res) => {
    res.json(calculateMonthlySales()); // Calculate sales dynamically
});

app.get('/api/admin/messages', (req, res) => {
    res.json(storedMessages);
});

// --- API Endpoint for receiving Contact Form messages ---
app.post('/api/contact-message', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // Store the message
    const newMessage = {
        name,
        email,
        message,
        date: new Date().toISOString()
    };
    storedMessages.unshift(newMessage);

    // Send an email notification to the admin
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>New Contact Form Submission</h2>
            <p>You have received a new message from your website's contact form.</p>
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p style="padding: 10px; border-left: 3px solid #eee;">${message}</p>
        </div>
    `;

    try {
        // --- Send two emails: one notification to admin, one auto-reply to customer ---

        // 1. Email to Admin
        const adminMailPromise = transporter.sendMail({
            from: `"Roast & Brew Website" <${email}>`, // Use customer's email as sender for admin notification
            to: 'roast.brew.brewery@gmail.com',
            subject: `New Message from ${name}`,
            html: emailHtml,
        });

        // 2. Auto-reply Email to Customer
        const customerMailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h1 style="color: #e67e22;">Thanks for reaching out, ${name}!</h1>
                <p>We've successfully received your message and appreciate you contacting us. A member of our team will review your inquiry and get back to you as soon as possible.</p>
                <p><strong>Here's a copy of your message:</strong></p>
                <blockquote style="border-left: 4px solid #eee; padding-left: 15px; margin-left: 5px; color: #555;">${message}</blockquote>
                <p style="margin-top: 30px;">Cheers,<br>The Roast & Brew Brewery Team</p>
            </div>
        `;
        const customerMailPromise = transporter.sendMail({
            from: '"Roast & Brew Brewery" <roast.brew.brewery@gmail.com>',
            to: email, // The customer's email address
            subject: "We've received your message!",
            html: customerMailHtml,
        });

        await Promise.all([adminMailPromise, customerMailPromise]);

        res.status(200).json({ message: 'Thank you! Your message has been sent.' });
    } catch (error) {
        console.error('Failed to send contact form email:', error);
        res.status(500).json({ message: 'Message stored, but failed to send email notification.' });
    }
});

// --- NEW: User Authentication Endpoints ---

// SIGN UP Endpoint
app.post('/api/signup', async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if user already exists
    if (storedUsers.find(u => u.email === email)) {
        return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Store new user
        const newUser = {
            fullName,
            email,
            password: hashedPassword
        };
        storedUsers.push(newUser);
        console.log(`New user signed up: ${email}`);

        // Send welcome email
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h1 style="color: #e67e22;">Welcome to Roast & Brew Brewery, ${fullName}!</h1>
                <p>Thank you for signing up! Your account has been created successfully.</p>
                <p>Ready to find your next favorite brew? Visit our shop to get started!</p>
                <!-- Use the live frontend URL from environment variables -->
                <a href="${process.env.FRONTEND_URL || 'http://localhost:57935'}/shop.html" style="display: inline-block; background-color: #e67e22; color: #fff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 20px;">
                    Go to Shop
                </a>
                <p style="margin-top: 30px;">Cheers,<br>The Roast & Brew Brewery Team</p>
            </div>
        `;
        await transporter.sendMail({
            from: '"Roast & Brew Brewery" <roast.brew.brewery@gmail.com>',
            to: email,
            subject: `Welcome to the Roast & Brew Family, ${fullName}!`,
            html: emailHtml,
        });

        // Respond with success and user info (excluding password)
        res.status(201).json({
            message: 'Sign-up successful! Welcome email sent.',
            user: {
                fullName: newUser.fullName,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error('Error during sign-up:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
});

// SIGN IN Endpoint
app.post('/api/signin', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = storedUsers.find(u => u.email === email);
    if (!user) {
        return res.status(404).json({ message: 'No account found with that email address.' });
    }

    try {
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            // Passwords match
            console.log(`User signed in: ${email}`);
            res.status(200).json({
                message: 'Sign-in successful!',
                user: {
                    fullName: user.fullName,
                    email: user.email
                }
            });
        } else {
            // Passwords don't match
            res.status(401).json({ message: 'Incorrect password. Please try again.' });
        }
    } catch (error) {
        console.error('Error during sign-in:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
});

// --- API Endpoint for sending Order Confirmation Email AND STORING THE ORDER ---
app.post('/api/send-order-confirmation-email', async (req, res) => { // Make the function async
    const { customerEmail, orderId, items, subtotalAmount, shippingCostAmount, totalAmount, shippingAddress, paymentMethod } = req.body;

    // Simulate stock reduction (simple example)
    items.forEach(orderedItem => {
        const productInStock = products.find(p => p.name === orderedItem.name);
        if (productInStock) {
            productInStock.stock -= orderedItem.quantity;
            if (productInStock.stock < 0) {
                productInStock.stock = 0; // Prevent negative stock for simplicity
            }
        }
    });

    const newOrder = {
        customerEmail,
        // Re-construct the orderDetails object for storage consistency with admin panel
        orderDetails: {
            orderId,
            items,
            subtotalAmount,
            shippingCostAmount
        },
        totalAmount,
        shippingAddress,
        paymentMethod,
        date: new Date().toISOString(), // Store the actual order placement date
        status: 'Order Placed' // Initial status
    };

    storedOrders.unshift(newOrder); // Add the new order to the beginning of our in-memory list

    // --- REAL EMAIL SENDING LOGIC ---
    console.log(`Order ${orderId} placed. Preparing to send confirmation email to: ${customerEmail}`);

    // Helper to format currency inside the server
    const formatCurrency = (amount) => {
        return `₱ ${parseFloat(amount).toFixed(2)}`;
    };

    // Construct a more detailed HTML email
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h1 style="color: #333;">Thank you for your order, ${shippingAddress.fullName}!</h1>
            <p>We've received your order and are getting it ready for you. Here are the details:</p>
            <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px;">Order ID: ${orderId}</h2>
            
            <h3>Items Ordered:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Quantity</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <h3>Order Summary:</h3>
            <p><strong>Subtotal:</strong> ${formatCurrency(subtotalAmount)}</p>
            <p><strong>Shipping:</strong> ${formatCurrency(shippingCostAmount)}</p>
            <p><strong>Total:</strong> ${formatCurrency(totalAmount)}</p>

            <h3>Shipping Address:</h3>
            <p>
                ${shippingAddress.fullName}<br>
                ${shippingAddress.addressLine1}<br>
                ${shippingAddress.addressLine2 ? shippingAddress.addressLine2 + '<br>' : ''}
                ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}<br>
                ${shippingAddress.country}
            </p>
            <p>Thank you for choosing Roast & Brew Brewery!</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: '"Roast & Brew Brewery" <roast.brew.brewery@gmail.com>',
            to: customerEmail, // List of receivers
            subject: `Your Roast & Brew Order Confirmation [${orderId}]`, // Subject line
            html: emailHtml, // html body
        });
        console.log(`Confirmation email sent successfully to ${customerEmail}.`);
        res.status(200).json({ message: 'Order confirmed and email sent successfully.' });
    } catch (error) {
        console.error(`Failed to send email to ${customerEmail}:`, error);
        // Still confirm order to user, but log the email error
        res.status(500).json({ message: 'Order placed, but failed to send confirmation email.', error: error.message });
    }
});

// --- API Endpoint for fetching orders for a specific user ---
app.get('/api/my-orders/:email', (req, res) => {
    const { email } = req.params;
    if (!email) {
        return res.status(400).json({ message: 'Email parameter is required.' });
    }

    const userOrders = storedOrders
        .filter(o => o.customerEmail === email)
        .map(o => ({ // Return data in the format the frontend expects
            id: o.orderDetails.orderId,
            date: o.date,
            total: o.totalAmount,
            status: o.status
        }));
    res.status(200).json(userOrders);
});

// --- API Endpoint for tracking a single order by ID ---
app.get('/api/track-order/:orderId', (req, res) => {
    const { orderId } = req.params;
    const order = storedOrders.find(o => o.orderDetails.orderId === orderId);

    if (order) {
        // Return only the necessary data for tracking to avoid exposing too much information
        res.status(200).json({
            id: order.orderDetails.orderId,
            date: order.date,
            total: order.totalAmount,
            status: order.status,
            email: order.customerEmail // Needed for signed-in user context
        });
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
});

// --- API Endpoint for updating an order's status (for Admin) ---
app.patch('/api/admin/orders/:orderId', (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    // Find the order to get its current state and customer details
    const order = storedOrders.find(o => o.orderDetails.orderId === orderId);

    if (order) {
        const oldStatus = order.status;
        order.status = status;
        console.log(`Admin updated order ${orderId} to status: ${status}`);

        // If the status has changed to a key milestone, send an email notification
        if (status !== oldStatus && (status === 'Out for Delivery' || status === 'Delivered')) {
            sendOrderStatusUpdateEmail(
                order.customerEmail,
                order.shippingAddress.fullName,
                orderId,
                status
            ).catch(err => {
                // Log the error, but don't block the admin's confirmation
                console.error(`Failed to send status update email for order ${orderId}:`, err);
            });
        }

        res.status(200).json({ message: 'Order status updated successfully.', order });
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
});

// --- Helper function to send order status update emails ---
async function sendOrderStatusUpdateEmail(customerEmail, customerName, orderId, newStatus) {
    let subject = '';
    let emailHtml = '';

    const commonHeader = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h1 style="color: #333;">Your Order Status Has Been Updated!</h1>
            <p>Hi ${customerName}, we have an update on your Roast & Brew order <strong>${orderId}</strong>.</p>
    `;
    const commonFooter = `
            <p>You can track your order anytime by visiting our website:</p>
            <!-- Use the live frontend URL from environment variables -->
            <a href="${process.env.FRONTEND_URL || 'http://localhost:57935'}/track.html" style="display: inline-block; background-color: #e67e22; color: #fff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 20px;">
                Track My Order
            </a>
            <p style="margin-top: 30px;">Cheers,<br>The Roast & Brew Brewery Team</p>
        </div>
    `;

    if (newStatus === 'Out for Delivery') {
        subject = `Your Roast & Brew Order [${orderId}] is Out for Delivery!`;
        emailHtml = `${commonHeader}<h2 style="color: #3498db;">Status: Out for Delivery</h2><p>Great news! Your order is now with our courier and on its way to you. Please expect it to arrive soon.</p>${commonFooter}`;
    } else if (newStatus === 'Delivered') {
        subject = `Your Roast & Brew Order [${orderId}] Has Been Delivered!`;
        emailHtml = `${commonHeader}<h2 style="color: #2ecc71;">Status: Delivered</h2><p>Your order has been successfully delivered. We hope you enjoy your brews!</p><p>If you have any questions or feedback, please don't hesitate to contact us.</p>${commonFooter}`;
    } else {
        return; // Don't send emails for other statuses like 'Processing'
    }

    await transporter.sendMail({
        from: '"Roast & Brew Brewery" <roast.brew.brewery@gmail.com>',
        to: customerEmail,
        subject: subject,
        html: emailHtml,
    });

    console.log(`Sent '${newStatus}' update email for order ${orderId} to ${customerEmail}.`);
}

// --- API Endpoint for updating product stock (for Admin) ---
app.patch('/api/admin/products/:productId', (req, res) => {
    const { productId } = req.params;
    const { stock } = req.body;

    if (stock === undefined || isNaN(stock) || stock < 0) {
        return res.status(400).json({ message: 'Invalid stock value provided.' });
    }

    const product = products.find(p => p.id === productId);

    if (product) {
        product.stock = parseInt(stock, 10);
        console.log(`Admin updated stock for product ${productId} to: ${product.stock}`);
        res.status(200).json({ message: 'Stock updated successfully.', product });
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

// --- Start the server ---
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
