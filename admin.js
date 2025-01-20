// Charger les vélos dans la liste admin
async function fetchBikesForAdmin() {
    try {
        console.log("Chargement des vélos pour l'admin..."); // Ajout du log
        const response = await fetch('/bikes');
        if (!response.ok) throw new Error('Erreur lors du chargement des vélos.');

        const bikes = await response.json();
        console.log('Données reçues :', bikes); // Ajout du log pour vérifier les données
        displayBikesForAdmin(bikes);
    } catch (error) {
        console.error(error);
        document.getElementById('bike-list').innerHTML = '<p>Erreur lors du chargement des vélos.</p>';
    }
}



// Affiche les vélos pour l'admin avec un bouton "Supprimer"
function displayBikesForAdmin(bikes) {
    console.log('Vélos à afficher :', bikes); // Debug
    const container = document.getElementById('bike-list');
    container.innerHTML = '';

    if (bikes.length === 0) {
        container.innerHTML = '<p>Aucun vélo disponible.</p>';
        return;
    }

    bikes.forEach((bike) => {
        const div = document.createElement('div');
        div.classList.add('bike-card');
        div.innerHTML = `
            <h3>${bike.name}</h3>
            <p>${bike.description}</p>
            <button onclick="deleteBike(${bike.id})">Supprimer</button>
        `;
        container.appendChild(div);
    });
}



// Ajouter un vélo
document.getElementById('add-bike-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Crée un objet FormData pour inclure les fichiers
    const formData = new FormData(document.getElementById('add-bike-form'));

    try {
        const response = await fetch('/bikes', {
            method: 'POST',
            body: formData, // Envoie toutes les données du formulaire, y compris l'image
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message || 'Vélo ajouté avec succès !');
            fetchBikesForAdmin(); // Recharge la liste des vélos
        } else {
            alert(result.message || 'Erreur lors de l’ajout du vélo.');
        }
    } catch (error) {
        console.error('Erreur réseau :', error);
        alert('Erreur réseau. Veuillez réessayer.');
    }
});



// Supprimer un vélo
async function deleteBike(bikeId) {
    if (!confirm('Voulez-vous vraiment supprimer ce vélo ?')) return;

    try {
        const response = await fetch(`/bikes/${bikeId}`, { method: 'DELETE' });
        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            fetchBikesForAdmin(); // Recharge la liste après suppression
        } else {
            alert('Erreur : ' + result.message);
        }
    } catch (error) {
        console.error('Erreur réseau :', error);
        alert('Erreur réseau. Veuillez réessayer.');
    }
}




// Charger les vélos au démarrage
document.addEventListener('DOMContentLoaded', fetchBikesForAdmin);
