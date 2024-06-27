google.charts.load('current', {'packages':['gantt']});
google.charts.setOnLoadCallback(drawGanttChart);

const budget = 300000; // 300k EUR
const resources = [];
let ganttChart;

document.getElementById('resourceForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const dailyCost = parseFloat(document.getElementById('dailyCost').value);
    const minDays = parseInt(document.getElementById('minDays').value);
    const startDate = document.getElementById('startDate').value;
    const color = document.getElementById('color').value;

    const resource = { name, dailyCost, minDays, startDate, color };
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
            Start Date: <input type="date" value="${resource.startDate}" onchange="updateResource(${index}, this.value)">
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

function updateResource(index, startDate) {
    resources[index].startDate = startDate;
    calculateAllocations();
}

function calculateAllocations() {
    const tasks = [];
    let totalCost = 0;

    resources.forEach((resource, index) => {
        const totalCostForResource = resource.dailyCost * resource.minDays;
        const startDate = new Date(resource.startDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + resource.minDays);

        tasks.push([
            `Task${index}`, resource.name, resource.name,
            startDate, endDate, null, 100, null
        ]);

        totalCost += totalCostForResource;
    });

    document.getElementById('totalCost').textContent = `${totalCost} EUR`;
    document.getElementById('budgetUsed').textContent = `${((totalCost / budget) * 100).toFixed(2)}%`;
    drawGanttChart(tasks);
    updateBudgetProgressBar(totalCost);
    updateBudgetDetails();
}

function drawGanttChart(tasks = []) {
    const data = new google.visualization.DataTable();
    data.addColumn('string', 'Task ID');
    data.addColumn('string', 'Task Name');
    data.addColumn('string', 'Resource');
    data.addColumn('date', 'Start Date');
    data.addColumn('date', 'End Date');
    data.addColumn('number', 'Duration');
    data.addColumn('number', 'Percent Complete');
    data.addColumn('string', 'Dependencies');

    data.addRows(tasks);

    const options = {
        height: 400,
        gantt: {
            trackHeight: 30
        }
    };

    ganttChart = new google.visualization.Gantt(document.getElementById('ganttChart'));
    ganttChart.draw(data, options);
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
    // Adjust the Gantt chart view mode here
    // Google Gantt chart does not support different view modes out of the box
    // This will require a different library or custom implementation for view modes
}

document.addEventListener('DOMContentLoaded', function() {
    calculateAllocations();
});
