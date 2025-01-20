document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Vérifie si l'utilisateur est connecté
        const authResponse = await fetch('/api/auth-status');
        const authData = await authResponse.json();

        if (!authData.isConnected) {
            alert("Vous devez être connecté pour accéder à cette page.");
            window.location.href = "login.html"; // Redirige vers la page de connexion
            return;
        }

        // Récupère les informations utilisateur
        await fetchUserInfo(); // Plus besoin de passer l'ID utilisateur, il est dans la session
        await fetchLikedBikes(authData.userId); // Passe l'ID utilisateur pour les vélos likés

        // Gestion de la mise à jour du profil
        document.getElementById('update-profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const body = { username, email };
            if (password) body.password = password;

            try {
                const response = await fetch('/users/self', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });

                if (response.ok) {
                    alert("Profil mis à jour avec succès !");
                    fetchUserInfo(); // Recharge les informations utilisateur
                } else {
                    const errorData = await response.json();
                    alert(`Erreur : ${errorData.message}`);
                }
            } catch (error) {
                console.error("Erreur réseau :", error);
                alert("Erreur réseau. Veuillez réessayer.");
            }
        });
    } catch (error) {
        console.error("Erreur lors de la vérification de l'état de connexion :", error);
        alert("Erreur réseau. Veuillez réessayer.");
    }
});

// Récupère les informations utilisateur
async function fetchUserInfo() {
    try {
        const response = await fetch('/users/self');
        if (!response.ok) {
            const errorData = await response.json();
            alert(`Erreur : ${errorData.message}`);
            return;
        }

        const user = await response.json();

        if (user.username && user.email) {
            document.getElementById('username').value = user.username;
            document.getElementById('email').value = user.email;
        } else {
            alert("Impossible de récupérer les informations utilisateur.");
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des informations utilisateur :", error);
        alert("Erreur réseau. Veuillez réessayer.");
    }
}

// Récupère les vélos likés
async function fetchLikedBikes(userId) {
    try {
        const response = await fetch(`/users/${userId}/favorites`);
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Erreur lors de la récupération des favoris :", errorData.message);
            return;
        }

        const bikes = await response.json();

        const container = document.getElementById('bikes-list');
        container.innerHTML = ''; // Réinitialise la liste

        if (bikes.length === 0) {
            container.innerHTML = "<p>Aucun favori pour le moment.</p>";
            return;
        }

        bikes.forEach((bike) => {
            const div = document.createElement('div');
            div.classList.add('bike-card');
            div.innerHTML = `
                <h3>${bike.name}</h3>
                <p><strong>Description :</strong> ${bike.description}</p>
                <p><strong>Catégorie :</strong> ${bike.category}</p>
                <p><strong>Marque :</strong> ${bike.brand}</p>
                <button onclick="removeFavorite(${bike.id})">Retirer des favoris</button>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des favoris :", error);
        alert("Erreur réseau. Veuillez réessayer.");
    }
}


// Fonction pour retirer un vélo des favoris
async function removeFavorite(bikeId) {
    try {
        const response = await fetch(`/bikes/${bikeId}/favorite`, { method: 'DELETE' });

        if (response.ok) {
            const result = await response.json();
            alert(result.message || "Retiré des favoris !");
            fetchLikedBikes(); // Recharge les favoris
        } else {
            const errorData = await response.json();
            alert(`Erreur : ${errorData.message || "Impossible de retirer des favoris."}`);
        }
    } catch (error) {
        console.error('Erreur réseau lors du retrait des favoris :', error);
        alert('Erreur réseau. Veuillez réessayer.');
    }
}





