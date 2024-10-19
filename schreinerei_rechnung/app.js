let projects = [];
let archivedProjects = [];

function loadProjects() {
    const storedProjects = localStorage.getItem('projects');
    const storedArchivedProjects = localStorage.getItem('archivedProjects');
    
    if (storedProjects) {
        projects = JSON.parse(storedProjects);
    }
    
    if (storedArchivedProjects) {
        archivedProjects = JSON.parse(storedArchivedProjects);
    }
    
    renderProjects();
    syncWithServer(); // Versuche, mit dem Server zu synchronisieren
}

function renderProjects(projectsToRender = null) {
    const grid = document.getElementById('projectGrid');
    grid.innerHTML = '';
    
    const currentProjects = projectsToRender || (window.location.pathname.includes('archive.html') ? archivedProjects : projects);
    
    currentProjects.sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));
    
    currentProjects.forEach(project => {
        const tile = document.createElement('div');
        tile.className = 'project-tile';
        tile.textContent = project.name;
        tile.onclick = () => openProject(project.id);
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '🗑️';
        deleteButton.className = 'delete-button';
        deleteButton.onclick = (e) => {
            e.stopPropagation();
            deleteProject(project.id);
        };
        tile.appendChild(deleteButton);
        
        grid.appendChild(tile);
    });
}

function openProject(id) {
    // Implementierung für das Öffnen eines Projekts
    window.location.href = `project.html?id=${id}`;
}

function searchProjects() {
    const searchTerm = document.getElementById('searchBar').value.toLowerCase();
    const currentProjects = window.location.pathname.includes('archive.html') ? archivedProjects : projects;
    const filteredProjects = currentProjects.filter(project => 
        project.name.toLowerCase().includes(searchTerm)
    );
    renderProjects(filteredProjects);
}

document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    document.getElementById('searchBar').addEventListener('input', searchProjects);
    if (document.getElementById('archiveButton')) {
        document.getElementById('archiveButton').addEventListener('click', () => {
            window.location.href = 'archive.html';
        });
    }
});

document.getElementById('newInvoiceButton').addEventListener('click', showNewInvoiceModal);
document.getElementById('searchBar').addEventListener('input', searchProjects);

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
        closeModal();
        renderProjects();
    }
}

function saveProjects() {
    localStorage.setItem('projects', JSON.stringify(projects));
    localStorage.setItem('archivedProjects', JSON.stringify(archivedProjects));
    saveProjectLocally(currentProject);
}

function showNewInvoiceModal() {
    document.getElementById('newInvoiceModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('newInvoiceModal').style.display = 'none';
}

function deleteProject(id) {
    showDeleteConfirmation(id);
}

function showDeleteConfirmation(id) {
    const modal = document.getElementById('deleteConfirmationModal');
    modal.style.display = 'block';
    document.getElementById('confirmDelete').onclick = () => {
        const index = projects.findIndex(p => p.id === id);
        if (index > -1) {
            projects.splice(index, 1);
            saveProjects();
            renderProjects();
        }
        modal.style.display = 'none';
    };
    document.getElementById('cancelDelete').onclick = () => {
        modal.style.display = 'none';
    };
}