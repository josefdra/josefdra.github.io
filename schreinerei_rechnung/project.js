let currentProject;

document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
});

function loadProject() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    currentProject = projects.find(p => p.id === projectId) || archivedProjects.find(p => p.id === projectId);
    
    if (currentProject) {
        renderProject();
    } else {
        alert('Projekt nicht gefunden');
    }
}

function renderProject() {
    document.getElementById('projectName').textContent = currentProject.name;
    renderItems();
    renderImages();
    updateArchiveButton();
}

function renderItems() {
    const tbody = document.querySelector('#itemsTable tbody');
    tbody.innerHTML = '';
    currentProject.items.forEach((item, index) => {
        tbody.appendChild(createItemRow(item, index));
    });
    // Fügen Sie immer eine leere Zeile am Ende hinzu
    tbody.appendChild(createItemRow({quantity: '', unit: '', pricePerUnit: ''}, currentProject.items.length));
    updateTotalPrice();
}

function createItemRow(item, index) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="number" value="${item.quantity || ''}" onchange="updateItem(${index}, 'quantity', this.value)"></td>
        <td>
            <select onchange="updateItem(${index}, 'unit', this.value)">
                <option value="Stk" ${item.unit === 'Stk' ? 'selected' : ''}>Stk</option>
                <option value="m³" ${item.unit === 'm³' ? 'selected' : ''}>m³</option>
                <option value="Std" ${item.unit === 'Std' ? 'selected' : ''}>Std</option>
            </select>
        </td>
        <td><input type="number" value="${item.pricePerUnit || ''}" onchange="updateItem(${index}, 'pricePerUnit', this.value)"></td>
        <td>${((item.quantity || 0) * (item.pricePerUnit || 0)).toFixed(2)} €</td>
    `;
    return row;
}

function updateItem(index, field, value) {
    if (index === currentProject.items.length) {
        // Wenn es sich um die letzte (leere) Zeile handelt, fügen Sie ein neues Item hinzu
        currentProject.items.push({quantity: '', unit: '', pricePerUnit: ''});
    }
    currentProject.items[index][field] = value !== '' ? parseFloat(value) : '';
    currentProject.lastEdited = new Date().toISOString();
    renderItems();
    saveProjects();
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Rechnung: ' + currentProject.name, 20, 20);
    
    doc.setFontSize(12);
    let y = 40;
    currentProject.items.forEach((item, index) => {
        if (item.quantity && item.pricePerUnit) {
            doc.text(`${item.quantity} ${item.unit} x ${item.pricePerUnit}€ = ${(item.quantity * item.pricePerUnit).toFixed(2)}€`, 20, y);
            y += 10;
        }
    });
    
    const total = currentProject.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit || 0), 0);
    doc.setFontSize(14);
    doc.text(`Gesamtpreis: ${total.toFixed(2)}€`, 20, y + 10);
    
    doc.save('rechnung.pdf');
}

function archiveProject() {
    const index = projects.findIndex(p => p.id === currentProject.id);
    if (index > -1) {
        projects.splice(index, 1);
        archivedProjects.push(currentProject);
        saveProjects();
        window.location.href = 'index.html';
    }
}