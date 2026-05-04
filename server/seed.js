const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🚀 Début du Seeding sur Railway (PostgreSQL)...');

  const password = await bcrypt.hash('password123', 10);

  try {
    // 1. Insertion des utilisateurs de test
    // Note : On utilise ON CONFLICT pour éviter les erreurs si tu lances le script 2 fois
    await pool.query(`
      INSERT INTO users (name, email, password_hash, phone, role) 
      VALUES ($1, $2, $3, $4, $5) 
      ON CONFLICT (email) DO NOTHING
    `, ['Marie Dupont', 'owner@test.com', password, '+33612345678', 'owner']);

    await pool.query(`
      INSERT INTO users (name, email, password_hash, phone, role) 
      VALUES ($1, $2, $3, $4, $5) 
      ON CONFLICT (email) DO NOTHING
    `, ['Jean Martin', 'renter@test.com', password, '+33687654321', 'renter']);

    console.log('✓ Utilisateurs créés (ou déjà présents)');

    // 2. Récupération de l'ID du propriétaire
    const ownerRes = await pool.query('SELECT id FROM users WHERE email = $1', ['owner@test.com']);
    const ownerId = ownerRes.rows[0].id;

    // 3. Liste des voitures de démo
    const cars = [
      {
        title: 'Toyota Corolla 2022 - Confort et fiabilité',
        description: 'Voiture en excellent état, climatisation, GPS intégré.',
        type: 'sedan', brand: 'Toyota', model: 'Corolla', year: 2022,
        seats: 5, transmission: 'auto', fuel: 'hybrid',
        price_per_day: 45, city: 'Paris', address: '15 Rue de Rivoli'
      },
      {
        title: 'Peugeot 3008 SUV - Spacieux et confortable',
        description: 'Grand SUV familial avec toit panoramique, idéal pour les voyages.',
        type: 'suv', brand: 'Peugeot', model: '3008', year: 2021,
        seats: 5, transmission: 'auto', fuel: 'diesel',
        price_per_day: 65, city: 'Lyon', address: '8 Place Bellecour'
      },
      {
        title: 'Mercedes Classe E - Luxe et élégance',
        description: 'Berline de luxe parfaitement entretenue. Sièges chauffants.',
        type: 'luxury', brand: 'Mercedes', model: 'Classe E', year: 2022,
        seats: 5, transmission: 'auto', fuel: 'petrol',
        price_per_day: 120, city: 'Nice', address: '5 Promenade des Anglais'
      }
    ];

    // 4. Insertion des voitures
    for (const car of cars) {
      await pool.query(`
        INSERT INTO cars (owner_id, title, description, type, brand, model, year, seats, transmission, fuel, price_per_day, city, address, images)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, '[]')
      `, [ownerId, car.title, car.description, car.type, car.brand, car.model,
          car.year, car.seats, car.transmission, car.fuel, car.price_per_day, car.city, car.address]);
    }

    console.log('✓ Voitures de démo créées');
    console.log('\n✨ Comptes de test prêts :');
    console.log('  owner@test.com  / password123');
    console.log('  renter@test.com / password123');

  } catch (err) {
    console.error('❌ Erreur pendant le seeding :', err.message);
  } finally {
    process.exit();
  }
}

seed();