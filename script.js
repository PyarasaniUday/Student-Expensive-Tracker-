// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app
    initApp();
});

function initApp() {
    // Load saved data from localStorage
    loadExpenses();
    loadBudget();
    updateSummary();
    updateCharts();
    checkBudgetStatus();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check initial theme
    checkTheme();
}

// Global variables
let expenses = [];
let monthlyBudget = localStorage.getItem('monthlyBudget') ? 
    parseFloat(localStorage.getItem('monthlyBudget')) : 5000;

// Theme control functions
function checkTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
    }
}

function toggleTheme() {
    if (document.body.classList.contains('dark-mode')) {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-moon"></i><span>Dark Mode</span>';
    } else {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
    }
    
    // Update charts with new theme
    updateCharts();
}

// Set up event listeners
function setupEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
    
    // Add expense form
    document.getElementById('expense-form').addEventListener('submit', addExpense);
    
    // Budget modal
    document.getElementById('set-budget-btn').addEventListener('click', openBudgetModal);
    document.getElementsByClassName('close')[0].addEventListener('click', closeBudgetModal);
    document.getElementById('budget-form').addEventListener('submit', setBudget);
    
    // Close notification
    document.getElementsByClassName('close-notification')[0].addEventListener('click', 
        () => document.getElementById('notification').classList.remove('show'));
    
    // Search and filter
    document.getElementById('search-expenses').addEventListener('input', filterExpenses);
    document.getElementById('filter-category').addEventListener('change', filterExpenses);
    
    // Export CSV
    document.getElementById('export-csv').addEventListener('click', exportToCSV);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('budget-modal')) {
            closeBudgetModal();
        }
    });
}

// Function to add a new expense
function addExpense(e) {
    e.preventDefault();
    
    const name = document.getElementById('expense-name').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;
    const notes = document.getElementById('expense-notes').value;
    
    const newExpense = {
        id: generateID(),
        name,
        amount,
        category,
        date,
        notes
    };
    
    expenses.push(newExpense);
    saveExpenses();
    updateExpensesList();
    updateSummary();
    updateCharts();
    checkBudgetStatus();
    
    // Reset form
    document.getElementById('expense-form').reset();
    
    // Show confirmation notification
    showNotification(`Added expense: ${name} (₹${amount})`);
}

// Function to generate a unique ID
function generateID() {
    return Math.random().toString(36).substr(2, 9);
}

// Function to save expenses to localStorage
function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Function to load expenses from localStorage
function loadExpenses() {
    const savedExpenses = localStorage.getItem('expenses');
    expenses = savedExpenses ? JSON.parse(savedExpenses) : [];
    updateExpensesList();
}

// Function to load budget from localStorage
function loadBudget() {
    document.getElementById('monthly-budget').textContent = monthlyBudget.toFixed(2);
    document.getElementById('budget-amount').value = monthlyBudget;
}

// Function to update the expenses list in the UI
function updateExpensesList() {
    const expensesList = document.getElementById('expenses-list');
    const noExpensesMessage = document.getElementById('no-expenses-message');
    
    if (expenses.length === 0) {
        expensesList.innerHTML = '';
        noExpensesMessage.style.display = 'block';
        return;
    }
    
    noExpensesMessage.style.display = 'none';
    
    // Sort expenses by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    expensesList.innerHTML = sortedExpenses.map(expense => `
        <tr data-id="${expense.id}">
            <td>${formatDate(expense.date)}</td>
            <td>
                ${expense.name}
                ${expense.notes ? `<i class="fas fa-info-circle" title="${expense.notes}"></i>` : ''}
            </td>
            <td><span class="category-badge category-${expense.category}">${expense.category}</span></td>
            <td>₹${expense.amount.toFixed(2)}</td>
            <td class="expense-actions">
                <button class="edit-btn" onclick="editExpense('${expense.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteExpense('${expense.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Function to format date
function formatDate(dateString) {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
}

// Function to update the summary section
function updateSummary() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Calculate total spent this month
    const totalMonthlySpent = expenses
        .filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
        })
        .reduce((total, expense) => total + expense.amount, 0);
    
    document.getElementById('total-spent').textContent = totalMonthlySpent.toFixed(2);
    
    // Calculate remaining budget
    const remaining = monthlyBudget - totalMonthlySpent;
    document.getElementById('remaining').textContent = remaining.toFixed(2);
    
    // Update progress bar
    const progressPercentage = (totalMonthlySpent / monthlyBudget) * 100;
    const progressBar = document.getElementById('budget-progress');
    progressBar.style.width = `${Math.min(progressPercentage, 100)}%`;
    
    // Change progress bar color based on percentage
    if (progressPercentage < 50) {
        progressBar.style.backgroundColor = '#4caf50'; // Green
    } else if (progressPercentage < 80) {
        progressBar.style.backgroundColor = '#ff9800'; // Orange
    } else {
        progressBar.style.backgroundColor = '#f44336'; // Red
    }

    checkBudgetStatus();
}

// Function to check budget status and show notifications if needed
// Function to check budget status and show notifications if needed
function checkBudgetStatus() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Calculate total spent this month
    const totalMonthlySpent = expenses
        .filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
        })
        .reduce((total, expense) => total + expense.amount, 0);
    
    const percentageUsed = (totalMonthlySpent / monthlyBudget) * 100;
    const remaining = monthlyBudget - totalMonthlySpent;
    
    // Show warning based on budget usage
    if (percentageUsed >= 70 && percentageUsed < 90) {
        // Approaching budget limit
        showNotification(`Warning: You've used ${percentageUsed.toFixed(0)}% of your monthly budget! Only ₹${remaining.toFixed(2)} remaining.`, 'warning');
        highlightBudgetCard('warning');
    } else if (percentageUsed >= 90 && percentageUsed < 100) {
        // Critical budget limit
        showNotification(`Critical: You've used ${percentageUsed.toFixed(0)}% of your budget! Only ₹${remaining.toFixed(2)} remaining.`, 'critical');
        highlightBudgetCard('critical');
    } else if (percentageUsed >= 100) {
        // Budget exceeded
        showNotification(`Alert: Budget exceeded by ₹${(totalMonthlySpent - monthlyBudget).toFixed(2)}! You are ${(percentageUsed - 100).toFixed(0)}% over budget.`, 'danger');
        highlightBudgetCard('danger');
    } else {
        // Reset highlights if budget is in good standing
        highlightBudgetCard('normal');
    }
}

// Function to highlight budget card based on status
function highlightBudgetCard(status) {
    const remainingCard = document.getElementById('remaining').closest('.card');
    
    // Remove existing status classes
    remainingCard.classList.remove('warning-status', 'critical-status', 'danger-status');
    
    // Add appropriate status class
    if (status === 'warning') {
        remainingCard.classList.add('warning-status');
    } else if (status === 'critical') {
        remainingCard.classList.add('critical-status');
    } else if (status === 'danger') {
        remainingCard.classList.add('danger-status');
    }
}

// Function to show notification
// Function to show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const notificationIcon = notification.querySelector('i');
    
    notificationMessage.textContent = message;
    
    // Set icon and color based on notification type
    if (type === 'warning') {
        notificationIcon.className = 'fas fa-exclamation-triangle';
        notificationIcon.style.color = '#ff9800';
        notification.style.borderLeft = '4px solid #ff9800';
    } else if (type === 'critical') {
        notificationIcon.className = 'fas fa-exclamation-triangle';
        notificationIcon.style.color = '#ff5722';
        notification.style.borderLeft = '4px solid #ff5722';
    } else if (type === 'danger') {
        notificationIcon.className = 'fas fa-exclamation-circle';
        notificationIcon.style.color = '#f44336';
        notification.style.borderLeft = '4px solid #f44336';
    } else {
        notificationIcon.className = 'fas fa-info-circle';
        notificationIcon.style.color = '#2196f3';
        notification.style.borderLeft = '4px solid #2196f3';
    }
    
    notification.classList.add('show');
    
    // Auto hide notification after 8 seconds (increased from 5 for important alerts)
    const timeout = (type === 'danger' || type === 'critical') ? 8000 : 5000;
    setTimeout(() => {
        notification.classList.remove('show');
    }, timeout);
}

// Function to delete an expense
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(expense => expense.id !== id);
        saveExpenses();
        updateExpensesList();
        updateSummary();
        updateCharts();
        showNotification('Expense deleted successfully');
    }
}

// Function to edit an expense
function editExpense(id) {
    const expense = expenses.find(exp => exp.id === id);
    
    if (!expense) return;
    
    // Fill form with expense data
    document.getElementById('expense-name').value = expense.name;
    document.getElementById('expense-amount').value = expense.amount;
    document.getElementById('expense-category').value = expense.category;
    document.getElementById('expense-date').value = expense.date;
    document.getElementById('expense-notes').value = expense.notes || '';
    
    // Remove the expense from the array (will be added back on form submit)
    expenses = expenses.filter(exp => exp.id !== id);
    
    // Update UI
    updateExpensesList();
    updateSummary();
    updateCharts();
    
    // Scroll to form
    document.querySelector('.expenses-form-section').scrollIntoView({ behavior: 'smooth' });
    
    showNotification('Editing expense. Submit the form to save changes.');
}

// Function to filter expenses
function filterExpenses() {
    const searchTerm = document.getElementById('search-expenses').value.toLowerCase();
    const categoryFilter = document.getElementById('filter-category').value;
    
    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.name.toLowerCase().includes(searchTerm) ||
                             expense.notes?.toLowerCase().includes(searchTerm) ||
                             expense.category.toLowerCase().includes(searchTerm);
        
        const matchesCategory = categoryFilter === '' || expense.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
    });
    
    renderFilteredExpenses(filteredExpenses);
}

// Function to render filtered expenses
function renderFilteredExpenses(filteredExpenses) {
    const expensesList = document.getElementById('expenses-list');
    const noExpensesMessage = document.getElementById('no-expenses-message');
    
    if (filteredExpenses.length === 0) {
        expensesList.innerHTML = '';
        noExpensesMessage.style.display = 'block';
        noExpensesMessage.textContent = 'No matching expenses found.';
        return;
    }
    
    noExpensesMessage.style.display = 'none';
    
    // Sort expenses by date (newest first)
    const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    expensesList.innerHTML = sortedExpenses.map(expense => `
        <tr data-id="${expense.id}">
            <td>${formatDate(expense.date)}</td>
            <td>
                ${expense.name}
                ${expense.notes ? `<i class="fas fa-info-circle" title="${expense.notes}"></i>` : ''}
            </td>
            <td><span class="category-badge category-${expense.category}">${expense.category}</span></td>
            <td>₹${expense.amount.toFixed(2)}</td>
            <td class="expense-actions">
                <button class="edit-btn" onclick="editExpense('${expense.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteExpense('${expense.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Budget Modal Functions
function openBudgetModal() {
    document.getElementById('budget-modal').style.display = 'flex';
    document.getElementById('budget-amount').value = monthlyBudget;
}

function closeBudgetModal() {
    document.getElementById('budget-modal').style.display = 'none';
}

function setBudget(e) {
    e.preventDefault();
    const newBudget = parseFloat(document.getElementById('budget-amount').value);
    monthlyBudget = newBudget;
    localStorage.setItem('monthlyBudget', newBudget);
    document.getElementById('monthly-budget').textContent = newBudget.toFixed(2);
    updateSummary();
    checkBudgetStatus();
    closeBudgetModal();
    showNotification(`Monthly budget set to ₹${newBudget.toFixed(2)}`);
}

// Charts functions
function updateCharts() {
    updateMonthlyChart();
    updateCategoryChart();
}

// function updateMonthlyChart() {
//     const ctx = document.getElementById('monthly-chart').getContext('2d');
    
//     // Get data for the past 6 months
//     const monthsData = getMonthlyData(6);
    
//     // Destroy previous chart if it exists
//     if (window.monthlyChart) {
//         window.monthlyChart.destroy();
//     }
    
//     const isDarkMode = document.body.classList.contains('dark-mode');
//     const textColor = isDarkMode ? '#f8f9fa' : '#212529';
//     const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
//     window.monthlyChart = new Chart(ctx, {
//         type: 'line',
//         data: {
//             labels: monthsData.labels,
//             datasets: [{
//                 label: 'Monthly Expenses (₹)',
//                 data: monthsData.values,
//                 borderColor: '#4361ee',
//                 backgroundColor: 'rgba(67, 97, 238, 0.1)',
//                 borderWidth: 2,
//                 tension: 0.3,
//                 fill: true,
//                 pointBackgroundColor: '#4361ee',
//                 pointRadius: 4,
//                 pointHoverRadius: 6
//             }]
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//                 legend: {
//                     labels: {
//                         color: textColor
//                     }
//                 },
//                 tooltip: {
//                     mode: 'index',
//                     intersect: false,
//                     callbacks: {
//                         label: function(context) {
//                             return `Expenses: ₹${context.raw.toFixed(2)}`;
//                         }
//                     }
//                 }
//             },
//             scales: {
//                 x: {
//                     grid: {
//                         color: gridColor
//                     },
//                     ticks: {
//                         color: textColor
//                     }
//                 },
//                 y: {
//                     beginAtZero: true,
//                     grid: {
//                         color: gridColor
//                     },
//                     ticks: {
//                         color: textColor,
//                         callback: function(value) {
//                             return '₹' + value;
//                         }
//                     }
//                 }
//             }
//         }
//     });
// }

function updateMonthlyChart() {
    const ctx = document.getElementById('monthly-chart').getContext('2d');
    
    // Get data for the past 6 months
    const monthsData = getMonthlyData(6);
    
    // Destroy previous chart if it exists
    if (window.monthlyChart) {
        window.monthlyChart.destroy();
    }
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#f5f3f4' : '#0b090a';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    window.monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthsData.labels,
            datasets: [{
                label: 'Monthly Expenses (₹)',
                data: monthsData.values,
                borderColor: '#e63946',
                backgroundColor: 'rgba(230, 57, 70, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#e63946',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `Expenses: ₹${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor,
                        callback: function(value) {
                            return '₹' + value;
                        }
                    }
                }
            }
        }
    });
}

// 

function updateCategoryChart() {
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    // Get category data
    const categoryData = getCategoryData();
    
    // Destroy previous chart if it exists
    if (window.categoryChart) {
        window.categoryChart.destroy();
    }
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#f5f3f4' : '#0b090a';
    
    window.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categoryData.labels,
            datasets: [{
                data: categoryData.values,
                backgroundColor: [
                    '#32cd32',     //food   
                    '#e5de00',     //trans  
                    '#dc6601',     //books   
                    '#e91e63',     //entertainment  
                    '#00d2ff',     //util   
                    '#d00000',     //rent   
                    '#8a00c2',     //clothing  
                    '#eee7ca',        
                    '#993333'        
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: textColor,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = ((value / categoryData.total) * 100).toFixed(1);
                            return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Function to get monthly data for the chart
function getMonthlyData(monthsCount) {
    const months = [];
    const values = [];
    
    // Get current date
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Generate months array
    for (let i = monthsCount - 1; i >= 0; i--) {
        let month = currentMonth - i;
        let year = currentYear;
        
        if (month < 0) {
            month = 12 + month;
            year--;
        }
        
        const monthDate = new Date(year, month);
        const monthName = monthDate.toLocaleString('default', { month: 'short' });
        months.push(`${monthName} ${year}`);
        
        // Calculate total for this month
        const monthTotal = expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
            })
            .reduce((total, expense) => total + expense.amount, 0);
        
        values.push(monthTotal);
    }
    
    return { labels: months, values: values };
}

// Function to get category data for the chart
function getCategoryData() {
    const categories = {};
    let total = 0;
    
    // Get current month and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Filter expenses for current month
    const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    // Calculate total for each category
    monthlyExpenses.forEach(expense => {
        if (!categories[expense.category]) {
            categories[expense.category] = 0;
        }
        categories[expense.category] += expense.amount;
        total += expense.amount;
    });
    
    const labels = Object.keys(categories);
    const values = Object.values(categories);
    
    return { labels, values, total };
}

// Function to export expenses to CSV
function exportToCSV() {
    if (expenses.length === 0) {
        showNotification('No expenses to export', 'warning');
        return;
    }
    
    // Create CSV content
    let csvContent = 'Date,Name,Category,Amount (₹),Notes\n';
    
    // Sort expenses by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedExpenses.forEach(expense => {
        // Format notes to avoid CSV issues
        const formattedNotes = expense.notes ? `"${expense.notes.replace(/"/g, '""')}"` : '';
        
        csvContent += `${expense.date},${expense.name},${expense.category},${expense.amount.toFixed(2)},${formattedNotes}\n`;
    });
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set link properties
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    // Add to document, click and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Expenses exported to CSV successfully');
}



// database

/*
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    // Simulate a simple check (replace with actual DB call)
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const user = storedUsers.find(u => u.username === username && u.password === password);

    if (user) {
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        document.getElementById('login-container').style.display = 'none';
        document.querySelector('.app-container').style.display = 'block';
        initApp(); // your existing function
    } else {
        alert("Invalid username or password");
    }
});

// Dummy data: Add a user if no users exist (you can remove this later)
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([{ username: "student", password: "1234" }]));
}


document.addEventListener('DOMContentLoaded', function () {
    const user = localStorage.getItem('loggedInUser');
    if (user) {
        document.getElementById('login-container').style.display = 'none';
        document.querySelector('.app-container').style.display = 'block';
        initApp();
    } else {
        document.getElementById('login-container').style.display = 'block';
        document.querySelector('.app-container').style.display = 'none';
    }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    const res = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const msg = await res.text();
    alert(msg);
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const msg = await res.text();
    if (res.ok) {
        alert("Login success");
        document.getElementById('auth-container').style.display = 'none';
        // You can now show the main app
    } else {
        alert(msg);
    }
});
*/
function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = "auth.html";
}
