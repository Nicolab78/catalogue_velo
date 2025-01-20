fetch('/api/auth-status')
    .then((response) => response.json())
    .then((data) => {
        console.log("Données reçues de /api/auth-status :", data); // Log pour vérifier
        const navbarLinks = document.querySelector('.navbar-links');
        navbarLinks.innerHTML = ''; // Réinitialise le contenu

        if (data.isConnected) {
            let linksHTML = `
                <a href="/index.html">Accueil</a>
                <a href="/liste_velo.html">Liste des vélos</a>
                <a href="/profile">Profil</a>
                <a href="#" id="logout">Déconnexion</a>
            `;

            // Ajoute le lien Admin si l'utilisateur est admin
            if (data.isAdmin) {
                linksHTML += `<a href="/admin.html">Admin</a>`;
            }

            navbarLinks.innerHTML = linksHTML;

            // Gestion de la déconnexion
            document.getElementById('logout').addEventListener('click', (e) => {
                e.preventDefault();
                fetch('/logout')
                    .then(() => window.location.reload())
                    .catch((err) => console.error('Erreur lors de la déconnexion :', err));
            });
        } else {
            navbarLinks.innerHTML = `
                <a href="/index.html">Accueil</a>
                <a href="/liste_velo.html">Liste des vélos</a>
                <a href="/login.html">Connexion</a>
                <a href="/register.html">Inscription</a>
            `;
        }
    })
    .catch((err) => console.error("Erreur lors de la récupération de l'état :", err));
