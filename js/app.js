
// 1. DATABASE WRAPPER (act like mongoDB)
const DB = {
    async getData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },
    async setData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
        return { success: true };
    }
};


let recipes = [];
let pantry = [];
let editIndex = null;


async function init() {
    recipes = await DB.getData('recipes');
    pantry = await DB.getData('pantry');
    groceryList = await DB.getData('grocery');
    
    if (document.getElementById('recipeGrid')) renderRecipes();
    if (document.getElementById('planBody')) { renderWeeklyPlan(); populateDropdown(); }
    if (document.getElementById('pantryBody')) renderPantry();
    if (document.getElementById('groceryBody')) renderGrocery();
    if (document.getElementById('notificationContainer')) renderNotifications();
}

//recipes
function renderRecipes() {
    const grid = document.getElementById('recipeGrid');

    if (!grid) return; 

    
    grid.innerHTML = recipes.map((recipe, index) => `
    
        <article class="recipe-card">
            <button class="btn-delete" onclick="deleteRecipe(${index})">&times;</button>

            
            <img src="${recipe.image ? recipe.image : '../images/recipe.avif'}"
            alt="${recipe.title}"
            onerror="this.onerror=null; this.src='../images/recipe.avif'">
                            
            <div class="recipe-card-content">
                <h3>${recipe.title}</h3>
                
                <div class="card-controls">
                    <button class="btn-edit" onclick="editRecipe(${index})">View/Edit Details</button>
                </div>

                <div class="plan-selector">
                    <label>Add to Weekly Plan:</label>
                    <div class="selector-group">
                        <select id="day-${index}">
                            <option>Monday</option>
                            <option>Tuesday</option>
                            <option>Wednesday</option>
                            <option>Thursday</option>
                            <option>Friday</option>
                            <option>Saturday</option>
                            <option>Sunday</option>
                        </select>
                        <select id="time-${index}">
                            <option>Breakfast</option>
                            <option>Lunch</option>
                            <option>Dinner</option>
                        </select>
                    </div>
                    <button class="btn-plan" onclick="addToPlan(${index})">Confirm Add</button>
                </div>
            </div>
        </article>
    `).join('');
}



document.getElementById('recipeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const rawIngredients = document.getElementById('recIngredients').value; 
    
    const recipeData = {
        title: document.getElementById('recTitle').value,
        image: document.getElementById('recImg').value,
        
        ingredients: rawIngredients.split(',').map(item => {
            const parts = item.split(':');
            return {
                name: parts[0].trim(),
                qty: parts[1] ? Number(parts[1].trim()) : 1 
            };
        }),
        method: document.getElementById('recMethod').value
    };

    if (editIndex !== null) {
        recipes[editIndex] = recipeData;
        editIndex = null;
    } else {
        recipes.push(recipeData);
    }

    await DB.setData('recipes', recipes);
    closeModal('recipeModal');
    resetForm();
    renderRecipes();
});


function resetForm() {
    document.getElementById('recipeForm')?.reset();
    document.getElementById('modalTitle').innerText = "New Recipe";
    editIndex = null;
}


function editRecipe(index) {
    const recipe = recipes[index];
    editIndex = index;
    
    document.getElementById('modalTitle').innerText = "Edit Recipe";
    document.getElementById('recTitle').value = recipe.title;
    document.getElementById('recImg').value = recipe.image;
    
    // Converting objs back to the string format for input field
    const ingredientString = recipe.ingredients.map(ing => `${ing.name}:${ing.qty}`).join(', ');
    document.getElementById('recIngredients').value = ingredientString;
    
    document.getElementById('recMethod').value = recipe.method;
    openModal('recipeModal');
}


async function deleteRecipe(index) {
    
    if (confirm(`Delete "${recipes[index].title}"?`)) {
        recipes.splice(index, 1);
        await DB.setData('recipes', recipes);
        renderRecipes();
    }
}


// plan.html
async function addToPlan(index) {
    

    const recipe = recipes[index];
    const day = document.getElementById(`day-${index}`) ? document.getElementById(`day-${index}`).value : document.getElementById('daySelect').value;
    const time = document.getElementById(`time-${index}`) ? document.getElementById(`time-${index}`).value : document.getElementById('timeSelect').value;

    let plan = await DB.getData('plan');
    let currentPantry = await DB.getData('pantry');
    let currentGrocery = await DB.getData('grocery');

    let missing = [];

    
    recipe.ingredients.forEach(reqIng => {
        const inPantry = currentPantry.find(p => p && p.name && p.name.toLowerCase() === reqIng.name.toLowerCase());
        
        // If not in pantry OR pantry qty is less than required
        if (!inPantry || Number(inPantry.qty) < Number(reqIng.qty)) {
            missing.push(reqIng);
        }
    });

    // Adding to Grocery List:
    if (missing.length > 0) {
        missing.forEach(reqIng => {
            const existing = currentGrocery.find(item => 
    item?.name?.toLowerCase() === reqIng?.name?.toLowerCase()
);
            if (existing) {
                existing.qty += reqIng.qty;
            } else {
                currentGrocery.push({ ...reqIng });
            }
        });
        await DB.setData('grocery', currentGrocery);
        alert(`Note: Insufficient stock for ${recipe.title}. Missing items added to Grocery List.`);
    }

    // Deduct what IS available from Pantry (preventing negative numbers)
    recipe.ingredients.forEach(reqIng => {
        const item = currentPantry.find(p => p.name.toLowerCase() === reqIng.name.toLowerCase());
        if (item) {
            // Only deduct if we have stock, otherwise set to 0
            let newQty = Number(item.qty) - Number(reqIng.qty);
            item.qty = newQty < 0 ? 0 : newQty;
        }
    });

    // Add recipe to plan
    plan.push({ ...recipe, day, time, id: Date.now() });
    
    await DB.setData('pantry', currentPantry);
    await DB.setData('plan', plan);
    
    // Refresh the UI if on the Weekly Plan page
    if(typeof renderWeeklyPlan === "function") renderWeeklyPlan();
    
    alert(`Success! ${recipe.title} added to ${day} ${time}.`);
}



function populateDropdown() {

    const select = document.getElementById('recipeSelect');
    
   
    if (!select) {
        return;
    }

  
    let htmlContent = '<option value="">Select a Recipe...</option>';

  
    const optionTags = recipes.map((recipe, index) => {
        
        return `<option value="${index}">${recipe.title}</option>`;
    });

    
    const allOptionsString = optionTags.join('');

    
    const finalHTML = htmlContent + allOptionsString;

    
    select.innerHTML = finalHTML;
}

async function renderWeeklyPlan() {
    const planBody = document.getElementById('planBody');
    if (!planBody) return;

    
    const savedPlan = await DB.getData('plan');
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const times = ["Breakfast", "Lunch", "Dinner"];

    planBody.innerHTML = days.map(day => `
        <tr>
            <td><strong>${day}</strong></td>
            ${times.map(time => {
                const meals = savedPlan.filter(m => m.day === day && m.time === time);
                return `
                    <td>
                        <div class="meal-slot">
                            ${meals.map(m => `
                                <div class="planned-item">
                                    <span>${m.title}</span>
                                    <span class="btn-mini-del" onclick="removeFromPlan(${m.id})">&times;</span>
                                </div>
                            `).join('')}
                        </div>
                    </td>
                `;
            }).join('')}
        </tr>
    `).join('');
}


async function manualAddToPlan() {
    const recipeIdx = document.getElementById('recipeSelect').value;
    if(recipeIdx === "") return alert("Please select a recipe");
    
   
    await addToPlan(Number(recipeIdx)); 
    
    
    renderWeeklyPlan();
}

async function removeFromPlan(mealId) {

    // Fetch current plan
    let currentPlan = await DB.getData('plan');
    
    //Filtering out the specific instance
   
    currentPlan = currentPlan.filter(m => m.id !== mealId);
    
   
    await DB.setData('plan', currentPlan);
    renderWeeklyPlan();
}



//pantry.html

function renderPantry() {
    const tbody = document.getElementById('pantryBody');
    if (!tbody) return;

    tbody.innerHTML = pantry.map((item, index) => {
        const status = getIngredientStatus(item);
        return `
            <tr>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>${item.unit || '-'}</td>
                <td>${item.expiry || 'N/A'}</td>
                <td><span class="badge badge-${status.class}">${status.text}</span></td>
                <td>
                    <button class="btn-edit-small" onclick="editPantryItem(${index})">Edit</button>
                    <button class="btn-del-small" onclick="deletePantryItem(${index})">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Check for alerts every time we render
    checkPantryAlerts();
}


function getIngredientStatus(item) {
    const today = new Date();
    const expiryDate = item.expiry ? new Date(item.expiry) : null;
    
    if (expiryDate && expiryDate < today) return { text: "Expired", class: "expired" };
    if (Number(item.qty) <= 2) return { text: "Low Stock", class: "low" };
    return { text: "OK", class: "ok" };
}

// save also edit
document.getElementById('pantryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemData = {
        name: document.getElementById('panName').value,
        qty: Number(document.getElementById('panQty').value),
        unit: document.getElementById('panUnit').value,
        expiry: document.getElementById('panExpiry').value
    };

    if (editIndex !== null) {
        pantry[editIndex] = itemData;
        editIndex = null;
    } else {
        pantry.push(itemData);
    }

    await DB.setData('pantry', pantry);
    closeModal('pantryModal');
    renderPantry();
});

function editPantryItem(index) {
    const item = pantry[index];
    editIndex = index;
    document.getElementById('pantryModalTitle').innerText = "Edit Item";
    document.getElementById('panName').value = item.name;
    document.getElementById('panQty').value = item.qty;
    document.getElementById('panUnit').value = item.unit;
    document.getElementById('panExpiry').value = item.expiry;
    openModal('pantryModal');
}

async function deletePantryItem(index) {
    if (confirm("Remove this item?")) {
        pantry.splice(index, 1);
        await DB.setData('pantry', pantry);
        renderPantry();
    }
}

//notifications.html

async function checkPantryAlerts() {
    let notifications = [];
    const today = new Date();

    pantry.forEach(item => {
        const expiryDate = item.expiry ? new Date(item.expiry) : null;
        
        if (expiryDate && expiryDate < today) {
            notifications.push({ type: 'danger', msg: `${item.name} has EXPIRED!` });
        } else if (Number(item.qty) <= 2) {
            notifications.push({ type: 'warning', msg: `${item.name} is running low (${item.qty} left).` });
        }
    });

// saveing for notification.html page

    await DB.setData('notifications', notifications);
}

function renderGrocery() {
    const list = document.getElementById('groceryBody');
    if (!list) return;

    list.innerHTML = groceryList.map((item, index) => `
        <li class="grocery-item ${item.checked ? 'checked' : ''}">
            <span><strong>${item.name}</strong> (Qty: ${item.qty})</span>
            <div class="groc-controls">
                <input type="checkbox" class="checkbox-custom" 
                       ${item.checked ? 'checked' : ''} 
                       onclick="toggleGrocery(${index})">
                <span class="btn-mini-del" onclick="deleteGroceryItem(${index})">&times;</span>
            </div>
        </li>
    `).join('');
}

// Manual Add via Form
document.getElementById('groceryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newItem = {
        name: document.getElementById('grocName').value,
        qty: Number(document.getElementById('grocQty').value),
        checked: false
    };

    groceryList.push(newItem);
    await DB.setData('grocery', groceryList);
    closeModal('groceryModal');
    renderGrocery();
});

async function toggleGrocery(index) {
    groceryList[index].checked = !groceryList[index].checked;
    await DB.setData('grocery', groceryList);
    renderGrocery();
}

async function deleteGroceryItem(index) {
    groceryList.splice(index, 1);
    await DB.setData('grocery', groceryList);
    renderGrocery();
}

async function clearGroceryList() {
    if(confirm("Clear the entire shopping list?")) {
        groceryList = [];
        await DB.setData('grocery', groceryList);
        renderGrocery();
    }
}

function renderNotifications() {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const today = new Date();
    let alerts = [];

    // Scan Pantry for issues
    pantry.forEach(item => {
        const expiryDate = item.expiry ? new Date(item.expiry) : null;
        
        // Expiry Check
        if (expiryDate && expiryDate < today) {
            alerts.push({
                type: 'danger',
                icon: '⚠️',
                msg: `EXPIRED: ${item.name} passed its expiry date on ${item.expiry}.`
            });
        } 
        // Approaching Expiry Check (within 3 days)
        else if (expiryDate) {
            const diffTime = expiryDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 3 && diffDays >= 0) {
                alerts.push({
                    type: 'warning',
                    icon: '⏳',
                    msg: `EXPIRING SOON: ${item.name} expires in ${diffDays} days.`
                });
            }
        }

        // Low Stock Check
        if (Number(item.qty) <= 2 && Number(item.qty) > 0) {
            alerts.push({
                type: 'warning',
                icon: '📉',
                msg: `LOW STOCK: You only have ${item.qty} ${item.unit || 'units'} of ${item.name} left.`
            });
        } else if (Number(item.qty) === 0) {
            alerts.push({
                type: 'danger',
                icon: '❌',
                msg: `OUT OF STOCK: ${item.name} is completely empty.`
            });
        }
    });

    // Display Alerts
    if (alerts.length === 0) {
        container.innerHTML = `<div class="alert-box" style="border-left-color: #2ecc71;">
            <span class="alert-icon">✅</span>
            <span class="alert-text">All good! No urgent alerts for your pantry.</span>
        </div>`;
    } else {
        container.innerHTML = alerts.map(a => `
            <div class="alert-box alert-${a.type}">
                <span class="alert-icon">${a.icon}</span>
                <span class="alert-text">${a.msg}</span>
            </div>
        `).join('');
    }
}

function openModal(id) { 

    document.getElementById(id).style.display = 'flex'; 

}

function closeModal(id) { 
    document.getElementById(id).style.display = 'none'; 
    if(id === 'recipeModal') {
        resetForm();
    }
}


init();