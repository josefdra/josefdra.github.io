let currentProject;
let isUpdating = false;

document.addEventListener('DOMContentLoaded', () => {
    loadProject();
    setupBackButton();
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
    document.getElementById('generatePdfButton').addEventListener('click', generatePDF);
    document.getElementById('toggleArchiveButton').addEventListener('click', toggleArchiveStatus);
    document.getElementById('projectDate').addEventListener('change', updateProjectDate);
    document.getElementById('generatePdfButton').addEventListener('click', generatePDF);
    document.body.addEventListener('focusin', function(e) {
        if (e.target.tagName === 'INPUT') {
            e.target.setSelectionRange(0, e.target.value.length);
        } else if (e.target.tagName === 'SELECT') {
            e.target.focus();
        }
    });
});

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const primaryColor = '#2C5E1A';
    const accentColor = '#8d693a';
    const textColor = '#000000';
    const backgroundColor = '#FFFFFF';
    const lightGrayColor = '#F5F5F5';
    
    // Hintergrund
    doc.setFillColor(backgroundColor);
    doc.rect(0, 0, 210, 297, 'F');
    
    // Rechnungskopf
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 55, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("Rechnung", 20, 30);
    
    // Name und Adresse
    doc.setFontSize(12);
    doc.text("Andreas Dräxl", 20, 40);
    doc.text("Windshausen 84 1/2", 20, 45);
    doc.text("83131 Nußdorf am Inn", 20, 50);
    
    // Projektdetails
    doc.setTextColor(textColor);
    const projectDate = currentProject.date ? new Date(currentProject.date).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE');
    doc.text(`Projektstart: ${projectDate}`, 20, 70);
    doc.text(`Projektname: ${currentProject.name}`, 20, 80);
    
    // Tabellenkopf
    const headers = ["Menge", "Einheit", "Beschreibung", "Preis/Einheit", "Gesamtpreis"];
    const colWidths = [20, 25, 65, 35, 35];
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    const tableStart = (210 - tableWidth) / 2;
    const colStarts = colWidths.reduce((acc, width, index) => [...acc, (acc[index - 1] || tableStart) + width], []);
    let yPosition = 95;
    
    const rowHeight = 12; // Erhöhte Zeilenhöhe für bessere Zentrierung
    
    // Tabellenkopf Hintergrund
    doc.setFillColor(primaryColor);
    doc.rect(tableStart, yPosition - rowHeight/2, tableWidth, rowHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    
    headers.forEach((header, index) => {
        const xPosition = colStarts[index] - colWidths[index];
        doc.text(header, xPosition + colWidths[index] - 2, yPosition + 1, { align: 'right', maxWidth: colWidths[index] - 4 });
    });
    
    // Tabelleninhalt
    doc.setTextColor(textColor);
    doc.setFont(undefined, 'normal');
    yPosition += rowHeight;
    
    currentProject.items.forEach((item, index) => {
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        // Hintergrund für gerade Zeilen
        if (index % 2 === 0) {
            doc.setFillColor(lightGrayColor);
        } else {
            doc.setFillColor(backgroundColor);
        }
        doc.rect(tableStart, yPosition - rowHeight/2, tableWidth, rowHeight, 'F');
        
        // Vertikal zentrierte Ausrichtung für alle Werte
        const verticalCenter = yPosition + 1; // Leichte Anpassung nach oben
        
        doc.text(item.quantity.toString(), colStarts[0] - 2, verticalCenter, { align: 'right', maxWidth: colWidths[0] - 4 });
        doc.text(item.unit, colStarts[1] - 2, verticalCenter, { align: 'right', maxWidth: colWidths[1] - 4 });
        doc.text(item.description, colStarts[2] - 2, verticalCenter, { align: 'right', maxWidth: colWidths[2] - 4 });
        doc.text(`${item.pricePerUnit.toFixed(2)} €/${item.unit}`, colStarts[3] - 2, verticalCenter, { align: 'right', maxWidth: colWidths[3] - 4 });
        doc.text(`${(item.quantity * item.pricePerUnit).toFixed(2)} €`, colStarts[4] - 2, verticalCenter, { align: 'right', maxWidth: colWidths[4] - 4 });
        
        yPosition += rowHeight;
    });
    
    // Gesamtsumme
    const total = currentProject.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
    yPosition += rowHeight/2;
    doc.setFont(undefined, 'bold');
    doc.setFillColor(lightGrayColor);
    doc.rect(tableStart, yPosition - rowHeight/2, tableWidth, rowHeight, 'F');
    doc.setTextColor(textColor);
    
    // Gesamtsumme mit Doppelpunkt in einer Zeile
    const gesamtsummeText = "Gesamtsumme:";
    const verticalCenter = yPosition + 1;
    doc.text(gesamtsummeText, colStarts[3] - 2, verticalCenter, { align: 'right' });
    doc.text(`${total.toFixed(2)} €`, colStarts[4] - 2, verticalCenter, { align: 'right', maxWidth: colWidths[4] - 4 });
    
    // Fußzeile
    doc.setFontSize(10);
    doc.setTextColor(textColor);
    doc.text("Vielen Dank für Ihr Vertrauen!", 105, 280, { align: "center" });
    
    // PDF speichern
    doc.save(`Rechnung_${currentProject.name}.pdf`);
}

function loadProject() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const archivedProjects = JSON.parse(localStorage.getItem('archivedProjects') || '[]');

    currentProject = projects.find(p => p.id === projectId) || archivedProjects.find(p => p.id === projectId);

    if (currentProject) {
        renderProject();
        updateProjectView();
    } else {
        alert('Projekt nicht gefunden');
    }
}

function updateProjectDate(event) {
    if (isProjectArchived()) return;

    currentProject.date = event.target.value;
    saveProject();
}

function toggleArchiveStatus() {
    const projectId = currentProject.id;
    toggleProjectArchiveStatus(projectId);
    loadProject();
}

function toggleProjectArchiveStatus(projectId) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const archivedProjects = JSON.parse(localStorage.getItem('archivedProjects') || '[]');

    let sourceArray, targetArray;
    if (projects.some(p => p.id === projectId)) {
        sourceArray = projects;
        targetArray = archivedProjects;
    } else {
        sourceArray = archivedProjects;
        targetArray = projects;
    }

    const projectIndex = sourceArray.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
        const project = sourceArray.splice(projectIndex, 1)[0];
        targetArray.push(project);

        localStorage.setItem('projects', JSON.stringify(projects));
        localStorage.setItem('archivedProjects', JSON.stringify(archivedProjects));
    }
}

function isProjectArchived() {
    const archivedProjects = JSON.parse(localStorage.getItem('archivedProjects') || '[]');
    return archivedProjects.some(p => p.id === currentProject.id);
}

function updateProjectView() {
    const isArchived = isProjectArchived();

    const toggleButton = document.getElementById('toggleArchiveButton');
    toggleButton.textContent = isArchived ? 'Weiter bearbeiten' : 'Projekt abschließen';

    // Deaktivieren der Bearbeitung, wenn das Projekt archiviert ist
    const inputs = document.querySelectorAll('#itemsTable input, #itemsTable select, #projectDate');
    inputs.forEach(input => {
        input.disabled = isArchived;
    });

    // Verstecken des "Bild hinzufügen" Buttons, wenn das Projekt archiviert ist
    const addImageButton = document.querySelector('.add-image');
    if (addImageButton) {
        addImageButton.style.display = isArchived ? 'none' : 'block';
    }

    // Entfernen der Lösch-Buttons für Zeilen, wenn das Projekt archiviert ist
    const deleteButtons = document.querySelectorAll('.delete-row');
    deleteButtons.forEach(button => {
        button.style.display = isArchived ? 'none' : 'inline';
    });
}

function setupBackButton() {
    document.getElementById('backButton').onclick = () => {
        history.back();
    };
}

function renderProject() {
    document.getElementById('projectName').textContent = currentProject.name;
    document.getElementById('projectDate').value = currentProject.date || new Date().toISOString().split('T')[0];
    renderItems();
    renderImages();
    updateArchiveButton();
}

function renderItems() {
    if (isUpdating) return;
    const tbody = document.querySelector('#itemsTable tbody');
    tbody.innerHTML = '';
    currentProject.items.forEach((item, index) => {
        tbody.appendChild(createItemRow(item, index));
    });
    // Fügen Sie immer eine leere Zeile am Ende hinzu, außer bei archivierten Projekten
    if (!isProjectArchived()) {
        tbody.appendChild(createItemRow({quantity: '', unit: '', description: '', pricePerUnit: ''}, currentProject.items.length));
    }
    updateTotalPrice();
}

function createItemRow(item, index) {
    const row = document.createElement('tr');
    const isArchived = isProjectArchived();
    row.innerHTML = `
        <td>
            ${!isArchived ? `<button onclick="deleteRow(${index})" class="delete-row" ${isArchived ? 'disabled' : ''}>×</button>` : ''}
            <input type="number" value="${item.quantity || ''}" onchange="updateItem(${index}, 'quantity', this.value)" inputmode="numeric" pattern="[0-9]*" ${isArchived ? 'disabled' : ''} tabindex="${index * 4 + 1}">
        </td>
        <td>
            <select onchange="updateItem(${index}, 'unit', this.value)" onkeydown="handleSelectKeydown(event, ${index})" ${isArchived ? 'disabled' : ''} tabindex="${index * 4 + 2}">
                <option value="" ${item.unit === '' ? 'selected' : ''}></option>
                <option value="Stk" ${item.unit === 'Stk' ? 'selected' : ''}>Stk</option>
                <option value="m³" ${item.unit === 'm³' ? 'selected' : ''}>m³</option>
                <option value="Std" ${item.unit === 'Std' ? 'selected' : ''}>Std</option>
            </select>
        </td>
        <td><input type="text" value="${item.description || ''}" onchange="updateItem(${index}, 'description', this.value)" ${isArchived ? 'disabled' : ''} tabindex="${index * 4 + 3}"></td>
        <td><input type="number" step="0.01" value="${item.pricePerUnit || ''}" onchange="updateItem(${index}, 'pricePerUnit', this.value)" inputmode="numeric" pattern="[0-9]*([.,][0-9]+)?" ${isArchived ? 'disabled' : ''} tabindex="${index * 4 + 4}"></td>
        <td>${((item.quantity || 0) * (item.pricePerUnit || 0)).toFixed(2)} €</td>
    `;
    return row;
}

function updateItem(index, field, value) {
    if (isProjectArchived()) return;
    
    isUpdating = true;
    
    if (index === currentProject.items.length) {
        // Wenn es sich um die letzte (leere) Zeile handelt, fügen Sie ein neues Item hinzu
        currentProject.items.push({quantity: '', unit: '', description: '', pricePerUnit: ''});
    }
    currentProject.items[index][field] = value !== '' ? (field === 'description' || field === 'unit' ? value : parseFloat(value)) : '';
    currentProject.lastEdited = new Date().toISOString();
    
    // Verzögern Sie das Rendern und Speichern, um schnelle aufeinanderfolgende Änderungen zu vermeiden
    setTimeout(() => {
        renderItems();
        saveProject();
        isUpdating = false;
    }, 300);
}

function handleSelectKeydown(event, index) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const select = event.target;
        const newIndex = (select.selectedIndex + (event.key === 'ArrowDown' ? 1 : -1) + select.options.length) % select.options.length;
        select.selectedIndex = newIndex;
        updateItem(index, 'unit', select.value);
    }
}

function deleteRow(index) {
    if (isProjectArchived()) return;

    currentProject.items.splice(index, 1);
    renderItems();
    saveProject();
}

function updateTotalPrice() {
    const total = currentProject.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit || 0), 0);
    document.getElementById('totalPrice').textContent = `Gesamtpreis: ${total.toFixed(2)} €`;
}

function renderImages() {
    const container = document.getElementById('imageContainer');
    container.innerHTML = '';
    currentProject.images.forEach((image, index) => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'image-container';
        const img = document.createElement('img');
        img.src = image;
        img.onclick = () => showFullSizeImage(image);
        imgContainer.appendChild(img);
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-image';
        deleteButton.textContent = '×';
        deleteButton.onclick = (e) => {
            e.stopPropagation();
            deleteImage(index);
        };
        imgContainer.appendChild(deleteButton);
        container.appendChild(imgContainer);
    });
    const addImageButton = document.createElement('div');
    addImageButton.className = 'add-image';
    addImageButton.innerHTML = '+';
    addImageButton.onclick = () => document.getElementById('imageUpload').click();
    container.appendChild(addImageButton);
}

function handleImageUpload(event) {
    const files = event.target.files;
    if (files.length > 0) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentProject.images.push(e.target.result);
                renderImages();
                saveProject();
            };
            reader.readAsDataURL(file);
        });
    }
}

function deleteImage(index) {
    currentProject.images.splice(index, 1);
    renderImages();
    saveProject();
}

function showFullSizeImage(src) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    const img = document.createElement('img');
    img.src = src;
    modal.appendChild(img);
    modal.onclick = () => document.body.removeChild(modal);
    document.body.appendChild(modal);
}

function updateArchiveButton() {
    const button = document.getElementById('toggleArchiveButton');
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    if (projects.find(p => p.id === currentProject.id)) {
        button.textContent = 'Projekt abschließen';
    } else {
        button.textContent = 'Bearbeitung aufnehmen';
    }
}

function saveProject() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const archivedProjects = JSON.parse(localStorage.getItem('archivedProjects') || '[]');

    const projectList = projects.find(p => p.id === currentProject.id) ? projects : archivedProjects;
    const index = projectList.findIndex(p => p.id === currentProject.id);

    if (index !== -1) {
        projectList[index] = currentProject;

        localStorage.setItem('projects', JSON.stringify(projects));
        localStorage.setItem('archivedProjects', JSON.stringify(archivedProjects));
    }
}