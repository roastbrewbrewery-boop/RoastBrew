document.addEventListener('DOMContentLoaded', () => {
    // Helper for backend URL
    const API_BASE_URL = 'http://localhost:57935/api/admin';

    // --- Tab Switching Logic ---
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Deactivate all
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Activate clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.dataset.tab;
            const activeTabContent = document.getElementById(tabId);
            if (activeTabContent) {
                activeTabContent.classList.add('active');
            }
        });
    });


    // --- Function to populate Orders Table ---
    async function populateOrdersTable() {
        const tableBody = document.querySelector('#orders-table tbody');
        tableBody.innerHTML = '<tr><td colspan="7">Loading orders...</td></tr>'; // Loading state (colspan is now 7)

        try {
            const response = await fetch(`${API_BASE_URL}/orders`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const orders = await response.json(); // Data from your server
            const orderStatuses = ['Order Placed', 'Processing Brews', 'Out for Delivery', 'Delivered'];

            tableBody.innerHTML = ''; // Clear existing rows

            if (orders.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7">No orders found.</td></tr>';
                return;
            }

            orders.forEach(order => {
                const row = tableBody.insertRow();
                row.insertCell().textContent = order.id; // Order ID
                row.insertCell().textContent = order.customerName; // Customer Name
                row.insertCell().textContent = order.product; // Product
                row.insertCell().textContent = order.quantity; // Quantity
                row.insertCell().textContent = new Date(order.orderDate).toLocaleDateString(); // Order Date

                // Status Dropdown Cell
                const statusCell = row.insertCell();
                const statusSelect = document.createElement('select');
                statusSelect.className = 'status-select';
                orderStatuses.forEach(status => {
                    const option = document.createElement('option');
                    option.value = status;
                    option.textContent = status;
                    if (status === order.status) {
                        option.selected = true;
                    }
                    statusSelect.appendChild(option);
                });
                statusCell.appendChild(statusSelect);

                // Action Button Cell
                const actionCell = row.insertCell();
                const updateButton = document.createElement('button');
                updateButton.className = 'update-btn';
                updateButton.textContent = 'Update';
                updateButton.dataset.orderId = order.id;
                actionCell.appendChild(updateButton);
            });

            // Add event listeners to all new update buttons
            document.querySelectorAll('.update-btn').forEach(button => {
                button.addEventListener('click', handleUpdateStatus);
            });

        } catch (error) {
            console.error('Error fetching orders for admin:', error);
            tableBody.innerHTML = `<tr><td colspan="7" style="color:red;">Error loading orders: ${error.message}</td></tr>`;
        }
    }

    // --- Function to populate Stock Table ---
    async function populateStockTable() {
        const tableBody = document.querySelector('#stock-table tbody');
        tableBody.innerHTML = '<tr><td colspan="5">Loading stock levels...</td></tr>'; // Updated colspan

        try {
            const response = await fetch(`${API_BASE_URL}/products`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json(); // Data from your server

            tableBody.innerHTML = ''; // Clear existing rows

            if (products.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5">No products found.</td></tr>';
                return;
            }

            products.forEach(product => {
                const row = tableBody.insertRow();
                row.insertCell().textContent = product.id; // Product ID
                row.insertCell().textContent = product.name; // Product Name
                row.insertCell().textContent = product.stock; // Current Stock

                // New Stock Input Cell
                const newStockCell = row.insertCell();
                const stockInput = document.createElement('input');
                stockInput.type = 'number';
                stockInput.className = 'stock-input';
                stockInput.placeholder = 'Enter new stock';
                stockInput.min = '0';
                newStockCell.appendChild(stockInput);

                // Action Button Cell
                const actionCell = row.insertCell();
                const updateButton = document.createElement('button');
                updateButton.className = 'update-stock-btn';
                updateButton.textContent = 'Update';
                updateButton.dataset.productId = product.id;
                actionCell.appendChild(updateButton);
            });

            // Add event listeners to all new stock update buttons
            document.querySelectorAll('.update-stock-btn').forEach(button => {
                button.addEventListener('click', handleUpdateStock);
            });

        } catch (error) {
            console.error('Error fetching stock for admin:', error);
            tableBody.innerHTML = `<tr><td colspan="5" style="color:red;">Error loading stock: ${error.message}</td></tr>`;
        }
    }

    // --- Function to populate Monthly Sales List ---
    async function populateMonthlySales() {
        const salesList = document.getElementById('monthly-sales-list');
        salesList.innerHTML = '<li>Loading sales data...</li>'; // Loading state

        try {
            const response = await fetch(`${API_BASE_URL}/sales`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const monthlySales = await response.json(); // Data from your server

            salesList.innerHTML = ''; // Clear existing items

            const salesKeys = Object.keys(monthlySales);
            if (salesKeys.length === 0) {
                salesList.innerHTML = '<li>No sales data available.</li>';
                return;
            }

            for (const product in monthlySales) {
                if (monthlySales.hasOwnProperty(product)) {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `<strong>${product}:</strong> <span>${monthlySales[product]} units sold</span>`;
                    salesList.appendChild(listItem);
                }
            }
        } catch (error) {
            console.error('Error fetching sales for admin:', error);
            salesList.innerHTML = `<li style="color:red;">Error loading sales: ${error.message}</li>`;
        }
    }

    // --- Function to populate Messages Table ---
    async function populateMessagesTable() {
        const tableBody = document.querySelector('#messages-table tbody');
        tableBody.innerHTML = '<tr><td colspan="4">Loading messages...</td></tr>';

        try {
            const response = await fetch(`${API_BASE_URL}/messages`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const messages = await response.json();

            tableBody.innerHTML = ''; // Clear existing rows

            if (messages.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4">No messages found.</td></tr>';
                return;
            }

            messages.forEach(msg => {
                const row = tableBody.insertRow();
                row.insertCell().textContent = new Date(msg.date).toLocaleString();
                row.insertCell().textContent = msg.name;
                const emailCell = row.insertCell();
                emailCell.innerHTML = `<a href="mailto:${msg.email}">${msg.email}</a>`;
                row.insertCell().textContent = msg.message;
            });

        } catch (error) {
            console.error('Error fetching messages for admin:', error);
            tableBody.innerHTML = `<tr><td colspan="4" style="color:red;">Error loading messages: ${error.message}</td></tr>`;
        }
    }


    // --- Function to handle status update ---
    async function handleUpdateStatus(event) {
        const button = event.target;
        const orderId = button.dataset.orderId;
        const row = button.closest('tr');
        const select = row.querySelector('.status-select');
        const newStatus = select.value;

        button.textContent = 'Updating...';
        button.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update status.');
            }

            button.textContent = 'Updated!';
            setTimeout(() => { button.textContent = 'Update'; button.disabled = false; }, 2000);

        } catch (error) {
            console.error('Error updating order status:', error);
            button.textContent = 'Error!';
            setTimeout(() => { button.textContent = 'Update'; button.disabled = false; }, 2000);
        }
    }

    // --- Function to handle stock update ---
    async function handleUpdateStock(event) {
        const button = event.target;
        const productId = button.dataset.productId;
        const row = button.closest('tr');
        const input = row.querySelector('.stock-input');
        const newStock = input.value;

        if (newStock === '' || isNaN(newStock) || parseInt(newStock) < 0) {
            alert('Please enter a valid, non-negative number for the stock.');
            return;
        }

        button.textContent = 'Updating...';
        button.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ stock: parseInt(newStock) }),
            });

            if (!response.ok) {
                throw new Error('Failed to update stock.');
            }

            // Refresh the stock table to show the new value
            await populateStockTable();

        } catch (error) {
            console.error('Error updating stock:', error);
            alert('An error occurred while updating stock. Please check the console.');
            button.textContent = 'Update'; // Reset button on error
            button.disabled = false;
        }
    }

    // --- Initial population of tables when the page loads ---
    populateOrdersTable();
    populateStockTable();
    populateMonthlySales();
    populateMessagesTable();

    // --- You could add functionality here to refresh data manually or periodically ---
    // Example:
    // setInterval(populateOrdersTable, 30000); // Refresh every 30 seconds
});