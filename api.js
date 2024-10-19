api.js
const API_URL = 'https://api.schreinerei-draexl.de'; // Ersetzen Sie dies durch die tatsächliche API-URL

let offlineChanges = [];
let hasUnsavedChanges = false;

async function syncWithServer() {
    if (!navigator.onLine) {
        showOfflineNotification();
        return;
    }

    try {
        // Senden von Offline-Änderungen
        for (let change of offlineChanges) {
            await sendChange(change);
        }
        offlineChanges = [];
        localStorage.removeItem('offlineChanges');

        // Abrufen der neuesten Daten vom Server
        const response = await fetch(`${API_URL}/projects`);
        if (!response.ok) throw new Error('Fehler beim Abrufen der Projekte');
        const data = await response.json();
        
        projects = data.activeProjects;
        archivedProjects = data.archivedProjects;
        
        localStorage.setItem('projects', JSON.stringify(projects));
        localStorage.setItem('archivedProjects', JSON.stringify(archivedProjects));
        
        hasUnsavedChanges = false;
        hideOfflineNotification();
        renderProjects(); // Aktualisieren der Anzeige
    } catch (error) {
        console.error('Synchronisierungsfehler:', error);
        showOfflineNotification();
    }
}

async function sendChange(change) {
    const response = await fetch(`${API_URL}/projects/${change.projectId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(change.data),
    });
    if (!response.ok) throw new Error('Fehler beim Senden der Änderung');
}

function saveProjectLocally(project) {
    const index = projects.findIndex(p => p.id === project.id);
    if (index !== -1) {
        projects[index] = project;
    } else {
        projects.push(project);
    }
    localStorage.setItem('projects', JSON.stringify(projects));
    
    offlineChanges.push({
        projectId: project.id,
        data: project,
    });
    localStorage.setItem('offlineChanges', JSON.stringify(offlineChanges));
    
    hasUnsavedChanges = true;
    showOfflineNotification();
}

function showOfflineNotification() {
    if (hasUnsavedChanges) {
        const notification = document.getElementById('offlineNotification');
        if (!notification) {
            const newNotification = document.createElement('div');
            newNotification.id = 'offlineNotification';
            newNotification.innerHTML = `
                Ungespeicherte Änderungen
                <button onclick="syncWithServer()">Jetzt speichern</button>
            `;
            document.body.appendChild(newNotification);
        }
        notification.style.display = 'block';
    }
}

function hideOfflineNotification() {
    const notification = document.getElementById('offlineNotification');
    if (notification) {
        notification.style.display = 'none';
    }
}

// Event Listener für Online/Offline-Status
window.addEventListener('online', syncWithServer);
window.addEventListener('offline', showOfflineNotification);

// Initial sync when the page loads
document.addEventListener('DOMContentLoaded', syncWithServer);