// Globale Variablen
let projects = [];
let archivedProjects = [];
let isDeleteMode = false;
let selectedForDeletion = new Set();

// Projekte laden und rendern
function loadProjects() {
    const storedProjects = localStorage.getItem('projects');
    const storedArchivedProjects = localStorage.getItem('archivedProjects');
    
    projects = storedProjects ? JSON.parse(storedProjects) : [];
    archivedProjects = storedArchivedProjects ? JSON.parse(storedArchivedProjects) : [];
    
    renderProjects();
}

// Projekte rendern
function renderProjects(projectsToRender = null) {
    const grid = document.getElementById('projectGrid');
    grid.innerHTML = '';
    
    const currentProjects = projectsToRender || (window.location.pathname.includes('archive.html') ? archivedProjects : projects);
    
    currentProjects.sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));
    
    currentProjects.forEach(project => {
        const tile = document.createElement('div');
        tile.className = 'project-tile';
        tile.textContent = project.name;
        
        if (isDeleteMode) {
            tile.onclick = () => selectForDeletion(project.id, tile);
            if (selectedForDeletion.has(project.id)) {
                tile.classList.add('selected-for-deletion');
            }
        } else {
            tile.onclick = () => openProject(project.id);
        }
        
        grid.appendChild(tile);
    });
}

// Löschmodus umschalten
function toggleDeleteMode() {
    isDeleteMode = !isDeleteMode;
    updateDeleteModeUI();
}

function updateDeleteModeUI() {
    document.body.classList.toggle('delete-mode', isDeleteMode);
    const deleteButton = document.getElementById('deleteButton');
    const confirmDeleteButton = document.getElementById('confirmDeleteButton');
    const cancelDeleteButton = document.getElementById('cancelDeleteButton');
    const newInvoiceButton = document.getElementById('newInvoiceButton');
    
    if (isDeleteMode) {
        deleteButton.style.display = 'none';
        confirmDeleteButton.style.display = 'block';
        cancelDeleteButton.style.display = 'block';
        if (newInvoiceButton) newInvoiceButton.style.display = 'none';
    } else {
        deleteButton.style.display = 'block';
        confirmDeleteButton.style.display = 'none';
        cancelDeleteButton.style.display = 'none';
        if (newInvoiceButton) newInvoiceButton.style.display = 'block';
    }
    
    // Ausgewählte Elemente zurücksetzen
    selectedForDeletion.clear();
    renderProjects();
}

// Löschen-Buttons aktualisieren
function updateDeleteButtons() {
    const deleteButton = document.getElementById('deleteButton');
    const confirmDeleteButton = document.getElementById('confirmDeleteButton');
    const cancelDeleteButton = document.getElementById('cancelDeleteButton');
    const newInvoiceButton = document.getElementById('newInvoiceButton');
    
    if (isDeleteMode) {
        deleteButton.style.display = 'none';
        confirmDeleteButton.style.display = 'block';
        cancelDeleteButton.style.display = 'block';
        if (newInvoiceButton) newInvoiceButton.style.display = 'none';
    } else {
        deleteButton.style.display = 'block';
        confirmDeleteButton.style.display = 'none';
        cancelDeleteButton.style.display = 'none';
        if (newInvoiceButton) newInvoiceButton.style.display = 'block';
    }
}

// Für Löschung auswählen
function selectForDeletion(id, element) {
    if (selectedForDeletion.has(id)) {
        selectedForDeletion.delete(id);
        element.classList.remove('selected-for-deletion');
    } else {
        selectedForDeletion.add(id);
        element.classList.add('selected-for-deletion');
    }
}

// Ausgewählte Projekte löschen
function deleteSelectedProjects() {
    if (selectedForDeletion.size === 0) return;

    const modal = document.getElementById('deleteConfirmationModal');
    modal.style.display = 'block';
    
    document.getElementById('confirmDelete').onclick = () => {
        const currentProjects = window.location.pathname.includes('archive.html') ? archivedProjects : projects;
        const updatedProjects = currentProjects.filter(p => !selectedForDeletion.has(p.id));
        
        if (window.location.pathname.includes('archive.html')) {
            archivedProjects = updatedProjects;
        } else {
            projects = updatedProjects;
        }
        
        saveProjects();
        exitDeleteMode();
        closeModal('deleteConfirmationModal');
        renderProjects();
    };
    
    document.getElementById('cancelDelete').onclick = () => {
        closeModal('deleteConfirmationModal');
    };
}

// Löschmodus verlassen
function exitDeleteMode() {
    isDeleteMode = false;
    updateDeleteModeUI();
}

// Neue Rechnung erstellen
function createNewInvoice() {
    const newInvoiceName = document.getElementById('newInvoiceName').value.trim();
    if (newInvoiceName) {
        const newProject = {
            id: Date.now().toString(),
            name: newInvoiceName,
            items: [],
            images: [],
            lastEdited: new Date().toISOString()
        };
        
        projects.unshift(newProject);
        saveProjects();
        closeModal('newInvoiceModal');
        renderProjects();
    }
}

// Projekte speichern
function saveProjects() {
    localStorage.setItem('projects', JSON.stringify(projects));
    localStorage.setItem('archivedProjects', JSON.stringify(archivedProjects));
}

// Modal für neue Rechnung anzeigen
function showNewInvoiceModal() {
    document.getElementById('newInvoiceModal').style.display = 'block';
}

// Modal schließen
function closeModal() {
    document.getElementById('newInvoiceModal').style.display = 'none';
    document.getElementById('deleteConfirmationModal').style.display = 'none';
}

// Projekt öffnen
function openProject(id) {
    window.location.href = `project.html?id=${id}`;
}

// Projekte suchen
function searchProjects() {
    const searchTerm = document.getElementById('searchBar').value.toLowerCase();
    const currentProjects = window.location.pathname.includes('archive.html') ? archivedProjects : projects;
    const filteredProjects = currentProjects.filter(project => 
        project.name.toLowerCase().includes(searchTerm)
    );
    renderProjects(filteredProjects);
}

// Event Listener hinzufügen
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    document.getElementById('searchBar').addEventListener('input', searchProjects);
    document.getElementById('deleteButton').addEventListener('click', toggleDeleteMode);
    document.getElementById('confirmDeleteButton').addEventListener('click', deleteSelectedProjects);
    document.getElementById('cancelDeleteButton').addEventListener('click', exitDeleteMode);
    
    if (document.getElementById('newInvoiceButton')) {
        document.getElementById('newInvoiceButton').addEventListener('click', showNewInvoiceModal);
    }
    if (document.getElementById('createNewInvoice')) {
        document.getElementById('createNewInvoice').addEventListener('click', createNewInvoice);
    }
    if (document.getElementById('archiveButton')) {
        document.getElementById('archiveButton').addEventListener('click', () => {
            window.location.href = 'archive.html';
        });
    }
    if (document.getElementById('backButton')) {
        document.getElementById('backButton').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
});

// Projekt archivieren oder wiederherstellen
function toggleProjectArchiveStatus(projectId) {
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
        saveProjects();
        
        // Wenn wir uns in der Projektansicht befinden, aktualisieren wir die Ansicht
        if (window.location.pathname.includes('project.html')) {
            updateProjectView();
        } else {
            renderProjects();
        }
    }
}

// Aktualisieren der Projektansicht
function updateProjectView() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    const project = projects.find(p => p.id === projectId) || archivedProjects.find(p => p.id === projectId);

    if (project) {
        document.getElementById('projectName').textContent = project.name;
        
        const toggleButton = document.getElementById('toggleArchiveButton');
        if (projects.includes(project)) {
            toggleButton.textContent = 'Projekt abschließen';
        } else {
            toggleButton.textContent = 'Weiter bearbeiten';
        }

        // Deaktivieren der Bearbeitung, wenn das Projekt archiviert ist
        const inputs = document.querySelectorAll('#itemsTable input, #itemsTable select');
        inputs.forEach(input => {
            input.disabled = archivedProjects.includes(project);
        });

        // Verstecken des "Bild hinzufügen" Buttons, wenn das Projekt archiviert ist
        const addImageButton = document.querySelector('.add-image');
        if (addImageButton) {
            addImageButton.style.display = archivedProjects.includes(project) ? 'none' : 'block';
        }
    }
}