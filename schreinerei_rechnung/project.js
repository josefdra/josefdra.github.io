let currentProject;

document.addEventListener('DOMContentLoaded', () => {
    loadProject();
    setupBackButton();
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
    document.getElementById('generatePdfButton').addEventListener('click', generatePDF);
    document.getElementById('toggleArchiveButton').addEventListener('click', toggleArchiveStatus);
    document.getElementById('projectDate').addEventListener('change', updateProjectDate);
    document.getElementById('generatePdfButton').addEventListener('click', generatePDF);
});

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Farben definieren
    const primaryColor = '#3498db';
    const secondaryColor = '#2c3e50';
    
    // Logo hinzufügen
    const logoImg = new Image();
    logoImg.src = 'logo_schreiner.webp';
    logoImg.onload = function() {
        const imgWidth = 40;
        const imgHeight = (logoImg.height * imgWidth) / logoImg.width;
        doc.addImage(logoImg, 'WEBP', 170, 10, imgWidth, imgHeight);
        
        // Rechnungskopf
        doc.setFontSize(24);
        doc.setTextColor(primaryColor);
        doc.text("Rechnung", 20, 30);
        
        doc.setFontSize(10);
        doc.setTextColor(secondaryColor);
        doc.text("Schreinerei Dräxl", 20, 40);
        doc.text("Musterstraße 123", 20, 45);
        doc.text("12345 Musterstadt", 20, 50);
        
        // Trennlinie
        doc.setDrawColor(primaryColor);
        doc.line(20, 55, 190, 55);
        
        // Rechnungsdetails
        doc.setFontSize(12);
        doc.text(`Datum: ${currentProject.date || new Date().toLocaleDateString()}`, 20, 65);
        doc.text(`Projektname: ${currentProject.name}`, 20, 72);
        
        // Tabellenkopf
        const headers = ["Menge", "Einheit", "Beschreibung", "Preis/Einheit (€)", "Gesamtpreis (€)"];
        let yPosition = 85;
        
        doc.setFillColor(primaryColor);
        doc.rect(20, yPosition - 5, 170, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        headers.forEach((header, index) => {
            doc.text(header, 22 + index * 34, yPosition);
        });
        
        // Tabelleninhalt
        doc.setTextColor(secondaryColor);
        doc.setFont(undefined, 'normal');
        yPosition += 10;
        currentProject.items.forEach((item, index) => {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            doc.text(item.quantity.toString(), 22, yPosition);
            doc.text(item.unit, 56, yPosition);
            doc.text(item.description, 90, yPosition, { maxWidth: 40 });
            doc.text(item.pricePerUnit.toFixed(2), 124, yPosition);
            doc.text((item.quantity * item.pricePerUnit).toFixed(2), 158, yPosition);
            yPosition += 10;
        });
        
        // Gesamtsumme
        const total = currentProject.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
        yPosition += 10;
        doc.setFont(undefined, 'bold');
        doc.setFillColor(primaryColor);
        doc.rect(130, yPosition - 5, 60, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(`Gesamtsumme: ${total.toFixed(2)} €`, 132, yPosition);
        
        // Fußzeile
        doc.setFontSize(10);
        doc.setTextColor(secondaryColor);
        doc.text("Vielen Dank für Ihr Vertrauen!", 105, 280, null, null, "center");
        
        // PDF speichern
        doc.save(`Rechnung_${currentProject.name}.pdf`);
    };
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
            <input type="number" value="${item.quantity || ''}" onchange="updateItem(${index}, 'quantity', this.value)" inputmode="numeric" pattern="[0-9]*" ${isArchived ? 'disabled' : ''}>
        </td>
        <td>
            <select onchange="updateItem(${index}, 'unit', this.value)" ${isArchived ? 'disabled' : ''}>
                <option value="" ${item.unit === '' ? 'selected' : ''}></option>
                <option value="Stk" ${item.unit === 'Stk' ? 'selected' : ''}>Stk</option>
                <option value="m³" ${item.unit === 'm³' ? 'selected' : ''}>m³</option>
                <option value="Std" ${item.unit === 'Std' ? 'selected' : ''}>Std</option>
            </select>
        </td>
        <td><input type="text" value="${item.description || ''}" onchange="updateItem(${index}, 'description', this.value)" ${isArchived ? 'disabled' : ''}></td>
        <td><input type="number" step="0.01" value="${item.pricePerUnit || ''}" onchange="updateItem(${index}, 'pricePerUnit', this.value)" inputmode="numeric" pattern="[0-9]*([.,][0-9]+)?" ${isArchived ? 'disabled' : ''}></td>
        <td>${((item.quantity || 0) * (item.pricePerUnit || 0)).toFixed(2)} €</td>
    `;
    return row;
}

function updateItem(index, field, value) {
    if (isProjectArchived()) return;
    
    if (index === currentProject.items.length) {
        // Wenn es sich um die letzte (leere) Zeile handelt, fügen Sie ein neues Item hinzu
        currentProject.items.push({quantity: '', unit: '', description: '', pricePerUnit: ''});
    }
    currentProject.items[index][field] = value !== '' ? (field === 'description' || field === 'unit' ? value : parseFloat(value)) : '';
    currentProject.lastEdited = new Date().toISOString();
    renderItems();
    saveProject();
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