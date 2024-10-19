let currentProject;

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
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><input type="number" value="${item.quantity}" onchange="updateItem(${index}, 'quantity', this.value)"></td>
            <td>
                <select onchange="updateItem(${index}, 'unit', this.value)">
                    <option value="Stk" ${item.unit === 'Stk' ? 'selected' : ''}>Stk</option>
                    <option value="m³" ${item.unit === 'm³' ? 'selected' : ''}>m³</option>
                    <option value="Std" ${item.unit === 'Std' ? 'selected' : ''}>Std</option>
                </select>
            </td>
            <td><input type="number" value="${item.pricePerUnit}" onchange="updateItem(${index}, 'pricePerUnit', this.value)"></td>
            <td>${(item.quantity * item.pricePerUnit).toFixed(2)} €</td>
        `;
    });
    updateTotalPrice();
}

function updateItem(index, field, value) {
    currentProject.items[index][field] = parseFloat(value);
    renderItems();
    saveProjects();
}

function updateTotalPrice() {
    const total = currentProject.items.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0);
    document.getElementById('totalPrice').textContent = `Gesamtpreis: ${total.toFixed(2)} €`;
}

function renderImages() {
    const container = document.getElementById('imageContainer');
    container.innerHTML = '';
    currentProject.images.forEach((image, index) => {
        const img = document.createElement('img');
        img.src = image;
        img.onclick = () => showFullSizeImage(image);
        container.appendChild(img);
    });
}

function showFullSizeImage(src) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.onclick = () => document.body.removeChild(modal);

    const img = document.createElement('img');
    img.src = src;
    img.style.maxWidth = '90%';
    img.style.maxHeight = '90%';

    modal.appendChild(img);
    document.body.appendChild(modal);
}

function updateArchiveButton() {
    const button = document.getElementById('toggleArchiveButton');
    if (archivedProjects.includes(currentProject)) {
        button.textContent = 'Bearbeitung aufnehmen';
        button.onclick = unarchiveProject;
    } else {
        button.textContent = 'Projekt abschließen';
        button.onclick = archiveProject;
    }
}

function archiveProject() {
    const index = projects.indexOf(currentProject);
    if (index > -1) {
        projects.splice(index, 1);
        archivedProjects.push(currentProject);
        saveProjects();
        updateArchiveButton();
    }
}

function unarchiveProject() {
    const index = archivedProjects.indexOf(currentProject);
    if (index > -1) {
        archivedProjects.splice(index, 1);
        projects.push(currentProject);
        saveProjects();
        updateArchiveButton();
    }
}

function handleImageUpload(event) {
    const files = event.target.files;
    if (files.length + currentProject.images.length > 3) {
        alert('Maximal 3 Bilder erlaubt');
        return;
    }
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentProject.images.push(e.target.result);
            renderImages();
            saveProjects();
        };
        reader.readAsDataURL(file);
    });
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Rechnung: ' + currentProject.name, 20, 20);
    
    doc.setFontSize(12);
    let y = 40;
    currentProject.items.forEach((item, index) => {
        doc.text(`${item.quantity} ${item.unit} x ${item.pricePerUnit}€ = ${(item.quantity * item.pricePerUnit).toFixed(2)}€`, 20, y);
        y += 10;
    });
    
    const total = currentProject.items.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0);
    doc.setFontSize(14);
    doc.text(`Gesamtpreis: ${total.toFixed(2)}€`, 20, y + 10);
    
    if (navigator.share && navigator.canShare) {
        // Für mobile Geräte mit Web Share API
        doc.output('dataurlstring').then(async function (pdfBase64) {
            const pdfFile = new File([pdfBase64], 'rechnung.pdf', {
                type: 'application/pdf',
            });
            
            try {
                await navigator.share({
                    files: [pdfFile],
                    title: 'Rechnung',
                    text: 'Hier ist Ihre Rechnung von Schreinerei Dräxl',
                });
            } catch (error) {
                console.error('Fehler beim Teilen:', error);
                // Fallback zum Herunterladen
                doc.save('rechnung.pdf');
            }
        });
    } else {
        // Für Desktop oder wenn Web Share API nicht verfügbar ist
        doc.save('rechnung.pdf');
    }
}

function saveProjects() {
    localStorage.setItem('projects', JSON.stringify(projects));
    localStorage.setItem('archivedProjects', JSON.stringify(archivedProjects));
    saveProjectLocally(currentProject);
}

document.addEventListener('DOMContentLoaded', () => {
    loadProject();
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
    document.getElementById('generatePdfButton').addEventListener('click', generatePDF);
});