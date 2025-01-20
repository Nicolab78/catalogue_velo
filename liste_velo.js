// Fonction pour récupérer les vélos depuis le backend
async function fetchBikes(filters = {}) {
    let query = '';
    if (filters.category) query += `?category=${filters.category}`;
    if (filters.brand) query += query ? `&brand=${filters.brand}` : `?brand=${filters.brand}`;

    try {
        const response = await fetch(`/bikes${query}`);
        if (!response.ok) {
            throw new Error('Erreur réseau : ' + response.statusText);
        }

        const bikes = await response.json();
        console.log('Données reçues du serveur :', bikes); // Debug : Voir les données
        displayBikes(bikes);
    } catch (error) {
        console.error('Erreur lors de la récupération des vélos :', error);
        const container = document.getElementById('bikes-list');
        container.innerHTML = `<p style="color: red;">Impossible de charger les vélos. Veuillez réessayer plus tard.</p>`;
    }
}

// Fonction pour afficher les vélos dans la section
function displayBikes(bikes) {
    const bikesList = document.getElementById('bikes-list');
    bikesList.innerHTML = ''; // Nettoie la liste avant d'afficher les résultats filtrés

    if (bikes.length === 0) {
        bikesList.innerHTML = '<p>Aucun vélo trouvé pour ce filtre.</p>';
        return;
    }

    bikes.forEach((bike) => {
        const bikeCard = document.createElement('div');
        bikeCard.classList.add('bike-card'); // Ajoutez une classe CSS pour le style
        bikeCard.innerHTML = `
            <img src="${bike.image_url}" alt="${bike.name}">
            <h3>${bike.name}</h3>
            <p><strong>Description :</strong> ${bike.description}</p>
            <p><strong>Catégorie :</strong> ${bike.category}</p>
            <p><strong>Marque :</strong> ${bike.brand}</p>
            <button onclick="addToFavorites(${bike.id})">Ajouter aux Favoris</button>
        `;
        bikesList.appendChild(bikeCard);
    });
}





// Fonction pour ajouter un vélo en favoris
async function favoriteBike(bikeId) {
    try {
        const response = await fetch(`/bikes/${bikeId}/favorite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message || "Ajouté aux favoris !");
            
            // Recharge la liste principale des vélos
            fetchBikes();

            // Recharge la liste des favoris si disponible
            if (typeof fetchFavorites === "function") {
                fetchFavorites();
            }
        } else {
            alert('Erreur : ' + (result.message || 'Impossible de mettre en favoris.'));
        }
    } catch (error) {
        console.error('Erreur réseau lors de l’ajout en favoris :', error);
        alert('Erreur réseau. Veuillez réessayer.');
    }
}







// Fonction pour filtrer les vélos
async function filterBikes() {
    const category = document.getElementById('category-filter').value;
    const brand = document.getElementById('brand-filter').value;

    try {
        // Faites une requête au serveur avec les paramètres de filtre
        const response = await fetch(`/bikes/filter?category=${category}&brand=${brand}`);
        if (!response.ok) throw new Error('Erreur lors du filtrage des vélos.');

        const bikes = await response.json();

        // Mettez à jour l'affichage des vélos avec les résultats filtrés
        displayBikes(bikes);
    } catch (error) {
        console.error('Erreur lors du filtrage des vélos :', error);
        document.getElementById('bikes-list').innerHTML =
            '<p>Une erreur est survenue lors du filtrage des vélos.</p>';
    }
}




// Charger tous les vélos au chargement de la page
document.addEventListener('DOMContentLoaded', () => fetchBikes());
