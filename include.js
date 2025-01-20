// Fonction pour charger la navbar dynamique
function loadNavbar() {
    const navbar = document.getElementById('navbar'); // Sélectionne le conteneur
    if (!navbar) {
        console.error("Erreur : le conteneur #navbar est introuvable.");
        return; // Arrête l'exécution si le conteneur est absent
    }

    fetch('/api/auth-status') // Appelle l'API pour vérifier l'état de connexion
        .then((response) => response.json())
        .then((data) => {
            navbar.innerHTML = ''; // Vide le contenu précédent

            if (data.isConnected) {
                // Utilisateur connecté
                let linksHTML = `
                    <nav class="navbar">
                        <a href="/index.html">Accueil</a>
                        <a href="/liste_velo.html">Liste des vélos</a>
                        <a href="/profile">Profil</a>
                        <a href="#" id="logout">Déconnexion</a>
                `;

                // Ajoute le lien Admin si l'utilisateur est admin
                if (data.isAdmin) {
                    linksHTML += `<a href="/admin.html">Admin</a>`;
                }

                linksHTML += `</nav>`; // Termine la navbar
                navbar.innerHTML = linksHTML;

                // Gestion de la déconnexion (ajoutée ici pour éviter des problèmes d'éléments non chargés)
                const logoutLink = document.getElementById('logout');
                logoutLink.addEventListener('click', (e) => {
                    e.preventDefault(); // Empêche le comportement par défaut du lien

                    fetch('/logout') // Appelle la route /logout côté serveur
                        .then((response) => {
                            if (response.ok) {
                                localStorage.removeItem('loggedInUserId'); // Supprime l'ID utilisateur
                                window.location.href = '/'; // Redirige vers la page d'accueil
                            } else {
                                console.error('Erreur lors de la déconnexion :', response.statusText);
                            }
                        })
                        .catch((err) => console.error('Erreur lors de la déconnexion :', err));
                });
            } else {
                // Utilisateur non connecté
                navbar.innerHTML = `
                    <nav class="navbar">
                        <a href="/index.html">Accueil</a>
                        <a href="/liste_velo.html">Liste des vélos</a>
                        <a href="/login.html">Connexion</a>
                        <a href="/register.html">Inscription</a>
                    </nav>
                `;
            }
        })
        .catch((err) => console.error('Erreur lors de la récupération de l\'état :', err));
}

// Charger la navbar une fois le DOM entièrement chargé
document.addEventListener('DOMContentLoaded', loadNavbar);
