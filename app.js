const budget = 300000; // 300k EUR
const resources = [];
let ganttChart;

document.getElementById('resourceForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const dailyCost = parseFloat(document.getElementById('dailyCost').value);
    const minDays = parseInt(document.getElementById('minDays').value);
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const color = document.getElementById('color').value;

    const resource = { id: resources.length + 1, name, dailyCost, minDays, startDate, endDate, color };
    resources.push(resource);

    updateResourceList();
    calculateAllocations();

    document.getElementById('resourceForm').reset();
});

function updateResourceList() {
    const resourceList = document.getElementById('resourceList');
    resourceList.innerHTML = '';

    resources.forEach((resource, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item resource-item';
        listItem.innerHTML = `
            ${resource.name} - Daily Cost: ${resource.dailyCost} EUR - Min Days: ${resource.minDays} -
            Start Date: <input type="date" value="${resource.startDate}" onchange="updateResource(${index}, this.value, 'start')">
            End Date: <input type="date" value="${resource.endDate}" onchange="updateResource(${index}, this.value, 'end')">
            Color: <input type="color" value="${resource.color}" onchange="updateResourceColor(${index}, this.value)">
            <div style="background-color: ${resource.color}; width: 20px; height: 20px;"></div>
        `;
        const removeButton = document.createElement('button');
        removeButton.className = 'btn btn-danger btn-sm';
        removeButton.textContent = 'Remove';
        removeButton.onclick = () => {
            resources.splice(index, 1);
            updateResourceList();
            calculateAllocations();
        };
        listItem.appendChild(removeButton);
        resourceList.appendChild(listItem);
    });
}

function updateResource(index, date, type) {
    if (type === 'start') {
        resources[index].startDate = date;
    } else if (type === 'end') {
        resources[index].endDate = date;
    }
    calculateAllocations();
}

function updateResourceColor(index, color) {
    resources[index].color = color;
    calculateAllocations();
}

function calculateAllocations() {
    const tasks = [];
    let totalCost = 0;

    resources.forEach((resource, index) => {
        const totalCostForResource = resource.dailyCost * resource.minDays;
        const startDate = new Date(resource.startDate);
        const endDate = new Date(resource.endDate);

        tasks.push({
            id: resource.id,
            text: resource.name,
            start_date: startDate,
            end_date: endDate,
            color: resource.color,
            dailyCost: resource.dailyCost,
            totalCost: totalCostForResource,
            budgetPercentage: (totalCostForResource / budget) * 100
        });

        totalCost += totalCostForResource;
    });

    document.getElementById('totalCost').textContent = `${totalCost} EUR`;
    document.getElementById('budgetUsed').textContent = `${((totalCost / budget) * 100).toFixed(2)}%`;
    drawGanttChart(tasks);
    updateBudgetProgressBar(totalCost);
    updateBudgetDetails();
}

function drawGanttChart(tasks = []) {
    ganttChart.clearAll();
    ganttChart.parse({
        data: tasks.map(task => ({
            id: task.id,
            text: task.text,
            start_date: task.start_date,
            end_date: task.end_date,
            color: task.color
        }))
    });
    ganttChart.render();
    document.getElementById('ganttChart').style.height = `${resources.length * 40 + 100}px`; // Dynamic height based on the number of resources
}

function updateBudgetProgressBar(totalCost) {
    const progressBar = document.getElementById('budgetProgressBar');
    const budgetUsedPercent = (totalCost / budget) * 100;
    progressBar.style.width = `${budgetUsedPercent}%`;
    progressBar.classList.toggle('bg-danger', budgetUsedPercent > 100);
    progressBar.classList.toggle('bg-success', budgetUsedPercent <= 100);
}

function updateBudgetDetails() {
    const budgetDetails = document.getElementById('budgetDetails');
    budgetDetails.innerHTML = '';
    resources.forEach(resource => {
        const totalCostForResource = resource.dailyCost * resource.minDays;
        const budgetPercentage = (totalCostForResource / budget) * 100;
        const detailItem = document.createElement('p');
        detailItem.textContent = `${resource.name} - Total Cost: ${totalCostForResource} EUR - Budget Usage: ${budgetPercentage.toFixed(2)}%`;
        budgetDetails.appendChild(detailItem);
    });
}

function saveState() {
    const state = { resources };
    localStorage.setItem('resourceState', JSON.stringify(state));
    alert('State saved!');
}

function loadState() {
    const state = localStorage.getItem('resourceState');
    if (state) {
        const { resources: savedResources } = JSON.parse(state);
        resources.length = 0;
        resources.push(...savedResources);
        updateResourceList();
        calculateAllocations();
        alert('State loaded!');
    } else {
        alert('No saved state found!');
    }
}

function setViewMode(mode) {
    if (mode === 'day') {
        ganttChart.config.scale_unit = 'day';
        ganttChart.config.date_scale = "%d %M";
    } else if (mode === 'week') {
        ganttChart.config.scale_unit = 'week';
        ganttChart.config.date_scale = "Week #%W";
        ganttChart.config.subscales = [{ unit: "day", step: 1, date: "%D" }];
    } else if (mode === 'month') {
        ganttChart.config.scale_unit = 'month';
        ganttChart.config.date_scale = "%F %Y";
        ganttChart.config.subscales = [{ unit: "week", step: 1, date: "Week #%W" }];
    }
    ganttChart.render();
}

function toggleResourceTimeline() {
    if (ganttChart.config.start_date && ganttChart.config.end_date) {
        ganttChart.config.start_date = null;
        ganttChart.config.end_date = null;
    } else {
        const startDates = resources.map(r => new Date(r.startDate));
        const endDates = resources.map(r => new Date(r.endDate));
        ganttChart.config.start_date = new Date(Math.min.apply(null, startDates));
        ganttChart.config.end_date = new Date(Math.max.apply(null, endDates));
    }
    ganttChart.render();
}

function toggleCollapsible() {
    const content = document.querySelector('.collapsible-content');
    content.style.display = content.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    ganttChart = gantt;
    ganttChart.init("ganttChart");

    ganttChart.attachEvent("onTaskDrag", function(id, mode, task) {
        const resource = resources.find(r => r.id == id);
        if (resource) {
            resource.startDate = task.start_date;
            resource.endDate = task.end_date;
            resource.minDays = (new Date(task.end_date) - new Date(task.start_date)) / (1000 * 60 * 60 * 24);
            updateResourceList();
            calculateAllocations();
        }
        return true;
    });

    ganttChart.attachEvent("onAfterTaskUpdate", function(id, task) {
        const resource = resources.find(r => r.id == id);
        if (resource) {
            resource.startDate = task.start_date;
            resource.endDate = task.end_date;
            resource.minDays = (new Date(task.end_date) - new Date(task.start_date)) / (1000 * 60 * 60 * 24);
            updateResourceList();
            calculateAllocations();
        }
    });

    ganttChart.attachEvent("onTaskDragEnd", function(id, task) {
        const resource = resources.find(r => r.id == id);
        if (resource) {
            resource.startDate = task.start_date;
            resource.endDate = task.end_date;
            resource.minDays = (new Date(task.end_date) - new Date(task.start_date)) / (1000 * 60 * 60 * 24);
            updateResourceList();
            calculateAllocations();
        }
    });

    calculateAllocations();
});
