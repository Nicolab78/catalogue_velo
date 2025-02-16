const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');


const app = express();
const PORT = 3000;

// Middleware pour les sessions
app.use(
  session({
    secret: 'secret-key', // Remplace par une clé sécurisée
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Mets `true` si tu utilises HTTPS
  })
);

// Middleware pour traiter les données JSON et URL-encoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware pour servir les fichiers statiques
app.use(express.static(path.join(__dirname)));

// Connexion à la base de données
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'catalogue_velos',
});

db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err.message);
    process.exit(1);
  }
  console.log('Connexion à la base de données réussie');
});

app.use('/upload', express.static(path.join(__dirname, 'upload')));

// Configuration de stockage pour multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, path.join(__dirname, 'upload')); // Dossier où les images seront stockées
  },
  filename: (req, file, cb) => {
      const uniqueName = Date.now() + '-' + file.originalname;
      cb(null, uniqueName); // Donne un nom unique au fichier
  }
});

// Création de l'objet multer
const upload = multer({ storage });

const fs = require('fs');
const uploadPath = path.join(__dirname, 'upload');

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath); // Crée le dossier s'il n'existe pas
}



app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
      console.error('Aucun fichier reçu.');
      return res.status(400).json({ message: 'Aucun fichier envoyé.' });
  }
  console.log('Fichier reçu :', req.file); // Debug
  const imageUrl = `/upload/${req.file.filename}`;
  res.status(201).json({
      message: 'Image uploadée avec succès.',
      imageUrl
  });
});





// ================================
// Authentification
// ================================

// Route API pour vérifier l'état de connexion
app.get('/api/auth-status', (req, res) => {
  console.log("Session actuelle :", req.session); // Log pour déboguer
  if (req.session.isConnected && req.session.userId) {
    return res.json({
      isConnected: true,
      userId: req.session.userId,
      isAdmin: req.session.isAdmin || false,
    });
  }
  res.json({ isConnected: false });
});


// Route d'inscription
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, result) => {
    if (err) return res.status(500).json({ error: 'Erreur serveur', details: err.message });

    if (result.length > 0) {
      return res.status(400).json({ message: "Nom d'utilisateur déjà pris." });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, "user")',
        [username, email, hashedPassword],
        (err, results) => {
          if (err) {
            return res.status(500).json({ error: "Erreur lors de l'insertion", details: err.message });
          }

          const userId = results.insertId;

          // Connecte immédiatement l'utilisateur
          req.session.isConnected = true;
          req.session.userId = userId;

          res.status(201).json({
            message: "Inscription réussie et connexion effectuée !",
            userId,
          });
        }
      );
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors du hachage du mot de passe', details: error.message });
    }
  });
});

// Route de connexion
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) {
      console.error('Erreur SQL :', err);
      return res.status(500).json({ message: 'Erreur interne.' });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "Nom d'utilisateur ou mot de passe incorrect." });
    }

    const user = results[0];

    // Vérification du mot de passe
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Nom d'utilisateur ou mot de passe incorrect." });
    }

    // Création de la session utilisateur
    req.session.isConnected = true;
    req.session.userId = user.id;
    req.session.isAdmin = user.role === 'admin'; // Vérifie si l'utilisateur est admin

    res.json({ message: 'Connexion réussie !', user: { username: user.username, role: user.role } });
  });
});

// Route de déconnexion
app.get('/logout', (req, res) => {
  console.log('Tentative de déconnexion');
  req.session.destroy((err) => {
    if (err) {
      console.error('Erreur lors de la déconnexion :', err);
      return res.status(500).json({ message: 'Erreur lors de la déconnexion.' });
    }
    res.json({ message: 'Déconnexion réussie.' });
  });
});








// Route pour afficher la page de profil
app.get('/profile', (req, res) => {
  if (!req.session.isConnected) {
    return res.status(403).send("Accès interdit. Vous devez être connecté.");
  }
  res.sendFile(path.join(__dirname, 'profil.html'));
});

// Route pour récupérer les informations de l'utilisateur connecté
app.get('/users/self', (req, res) => {
  if (!req.session.isConnected) {
    return res.status(403).json({ message: 'Non autorisé.' });
  }

  const userId = req.session.userId;
  db.query('SELECT username, email FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Erreur SQL :', err);
      return res.status(500).json({ message: 'Erreur serveur.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    res.json(results[0]);
  });
});


// Route pour mettre à jour les informations de l'utilisateur connecté
app.put('/users/self', async (req, res) => {
  if (!req.session.isConnected || !req.session.userId) {
    console.log('Mise à jour refusée : utilisateur non connecté ou session invalide.');
    return res.status(403).json({ message: 'Non autorisé.' });
  }

  const userId = req.session.userId;
  const { username, email, password } = req.body;

  console.log('Données reçues pour mise à jour :', { username, email, password });

  // Prépare les champs à mettre à jour
  const updates = [];
  const queryValues = [];
  if (username) {
    updates.push('username = ?');
    queryValues.push(username);
  }
  if (email) {
    updates.push('email = ?');
    queryValues.push(email);
  }
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updates.push('password = ?');
    queryValues.push(hashedPassword);
  }

  // Vérifie s'il y a des champs à mettre à jour
  if (updates.length === 0) {
    return res.status(400).json({ message: 'Aucun champ à mettre à jour.' });
  }

  queryValues.push(userId); // Ajoute l'ID utilisateur en dernier

  // Construit et exécute la requête SQL
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

  console.log('Requête SQL :', query, 'Valeurs :', queryValues);

  db.query(query, queryValues, (err) => {
    if (err) {
      console.error('Erreur lors de la mise à jour des informations utilisateur :', err);
      return res.status(500).json({ message: 'Erreur serveur.', details: err.message });
    }

    res.json({ message: 'Profil mis à jour avec succès.' });
  });
});


app.get('/users/:id/favorites', (req, res) => {
  const userId = req.params.id;

  const query = `
      SELECT 
          bikes.id, 
          bikes.name, 
          bikes.description, 
          categories.name AS category, 
          brands.name AS brand 
      FROM favorites 
      JOIN bikes ON favorites.bike_id = bikes.id
      LEFT JOIN categories ON bikes.category_id = categories.id
      LEFT JOIN brands ON bikes.brand_id = brands.id
      WHERE favorites.user_id = ?
  `;

  db.query(query, [userId], (err, results) => {
      if (err) {
          console.error('Erreur lors de la récupération des favoris :', err);
          return res.status(500).json({ message: 'Erreur serveur.' });
      }

      res.json(results);
  });
});



//montrer les vélos 

app.get('/bikes', (req, res) => {
  const query = `
      SELECT bikes.id, bikes.name, bikes.description, bikes.image_url, 
             categories.name AS category, brands.name AS brand
      FROM bikes
      JOIN categories ON bikes.category_id = categories.id
      JOIN brands ON bikes.brand_id = brands.id
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error('Erreur lors de la récupération des vélos :', err);
          return res.status(500).json({ message: 'Erreur lors de la récupération des vélos.' });
      }
      res.json(results);
  });
});




// Route pour ajouter un vélo en favoris
app.post('/bikes/:id/favorite', (req, res) => {
  const userId = req.session.userId;
  const bikeId = req.params.id;

  console.log("Tentative d'ajout aux favoris :");
  console.log("Utilisateur ID :", userId);
  console.log("Vélo ID :", bikeId);

  if (!userId) {
      console.log("Erreur : utilisateur non connecté.");
      return res.status(401).json({ message: 'Non autorisé.' });
  }

  // Vérifie si le vélo est déjà en favori
db.query(
  'SELECT * FROM favorites WHERE user_id = ? AND bike_id = ?',
  [userId, bikeId],
  (err, results) => {
      if (err) {
          console.error('Erreur SQL (vérification) :', err);
          return res.status(500).json({ message: 'Erreur serveur.' });
      }

      if (results.length > 0) {
          console.log("Ce vélo est déjà dans les favoris.");
          return res.status(400).json({ message: 'Ce vélo est déjà dans les favoris.' });
      }

      // Ajout du favori
      db.query(
          'INSERT INTO favorites (user_id, bike_id) VALUES (?, ?)',
          [userId, bikeId],
          (err) => {
              if (err) {
                  console.error('Erreur SQL (ajout) :', err);
                  return res.status(500).json({ message: 'Erreur serveur.' });
              }
              console.log("Ajout réussi !");
              res.json({ message: 'Vélo ajouté aux favoris.' });
          }
      );
  }
);

});

app.delete('/bikes/:id/favorite', (req, res) => {
  const userId = req.session.userId;
  const bikeId = req.params.id;

  if (!userId) {
      return res.status(401).json({ message: 'Non autorisé.' });
  }

  db.query(
      'DELETE FROM favorites WHERE user_id = ? AND bike_id = ?',
      [userId, bikeId],
      (err) => {
          if (err) {
              console.error('Erreur SQL :', err);
              return res.status(500).json({ message: 'Erreur serveur.' });
          }
          res.json({ message: 'Vélo retiré des favoris.' });
      }
  );
});

app.get('/users/:id/favorites', (req, res) => {
  const userId = req.params.id;

  db.query(
      `SELECT bikes.* FROM bikes
       JOIN favorites ON bikes.id = favorites.bike_id
       WHERE favorites.user_id = ?`,
      [userId],
      (err, results) => {
          if (err) {
              console.error('Erreur SQL :', err);
              return res.status(500).json({ message: 'Erreur serveur.' });
          }
          res.json(results);
      }
  );
});


// Route pour ajouter un vélo
app.post('/bikes', upload.single('image'), (req, res) => {
  const { name, description, category, brand } = req.body;
  const imageUrl = req.file ? `/upload/${req.file.filename}` : null;

  if (!name || !description || !category || !brand || !imageUrl) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
  }

  const sql = 'INSERT INTO bikes (name, description, category_id, brand_id, image_url) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [name, description, category, brand, imageUrl], (err) => {
      if (err) {
          console.error('Erreur SQL :', err);
          return res.status(500).json({ message: 'Erreur lors de l’ajout du vélo.' });
      }

      res.status(201).json({ message: 'Vélo ajouté avec succès !' });
  });
});





// Route pour supprimer un vélo
app.delete('/bikes/:id', (req, res) => {
  const bikeId = req.params.id;

  const query = `DELETE FROM bikes WHERE id = ?`;
  db.query(query, [bikeId], (err) => {
      if (err) {
          console.error('Erreur SQL :', err);
          return res.status(500).json({ message: 'Erreur lors de la suppression du vélo.' });
      }

      res.json({ message: 'Vélo supprimé avec succès.' });
  });
});


app.get('/bikes/filter', (req, res) => {
  const { category, brand } = req.query;

  let query = `
      SELECT bikes.id, bikes.name, bikes.description, bikes.image_url, categories.name AS category, brands.name AS brand
      FROM bikes
      JOIN categories ON bikes.category_id = categories.id
      JOIN brands ON bikes.brand_id = brands.id
      WHERE 1=1
  `;
  const params = [];

  // Appliquez les filtres si nécessaire
  if (category) {
      query += ' AND categories.id = ?';
      params.push(category);
  }
  if (brand) {
      query += ' AND brands.id = ?';
      params.push(brand);
  }

  db.query(query, params, (err, results) => {
      if (err) {
          console.error('Erreur SQL :', err);
          return res.status(500).json({ message: 'Erreur lors du filtrage.' });
      }
      res.json(results); // Renvoie les vélos filtrés au client
  });
});




// Middleware pour vérifier si l'utilisateur est un admin
function ensureAdmin(req, res, next) {
  if (!req.session.isConnected || !req.session.userId) {
      return res.status(403).send('Accès interdit : Vous devez être connecté.');
  }

  db.query('SELECT role FROM users WHERE id = ?', [req.session.userId], (err, results) => {
      if (err || results.length === 0 || results[0].role !== 'admin') {
          return res.status(403).send('Accès interdit : Vous n\'êtes pas administrateur.');
      }

      next(); // Passe à l'étape suivante si l'utilisateur est admin
  });
}

// Route pour l'accès à la page admin
app.get('/admin.html', ensureAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});



// Route pour gérer l'upload
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier envoyé.' });
    }

    // Utilisez req.file ici où il est défini
    const imageUrl = `/upload/${req.file.filename}`;
    console.log('Fichier reçu :', req.file); // Pour vérifier les détails du fichier

    res.status(201).json({
        message: 'Image uploadée avec succès.',
        imageUrl
    });
});




// ================================
// Lancer le serveur
// ================================
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});


