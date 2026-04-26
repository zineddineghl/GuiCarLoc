const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'rentcar.db'));

async function seed() {
  console.log('Seeding database...');

  const password = await bcrypt.hash('password123', 10);

  // Insert demo users
  try {
    db.prepare(`INSERT OR IGNORE INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)`)
      .run('Marie Dupont', 'owner@test.com', password, '+33612345678', 'owner');

    db.prepare(`INSERT OR IGNORE INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)`)
      .run('Jean Martin', 'renter@test.com', password, '+33687654321', 'renter');

    console.log('✓ Users created');
  } catch (e) {
    console.log('Users already exist');
  }

  // Get owner id
  const owner = db.prepare('SELECT id FROM users WHERE email = ?').get('owner@test.com');

  // Insert demo cars
  const cars = [
    {
      title: 'Toyota Corolla 2022 - Confort et fiabilité',
      description: 'Voiture en excellent état, climatisation, GPS intégré. Parfaite pour les déplacements en ville et sur autoroute.',
      type: 'sedan', brand: 'Toyota', model: 'Corolla', year: 2022,
      seats: 5, transmission: 'auto', fuel: 'hybrid',
      price_per_day: 45, city: 'Paris', address: '15 Rue de Rivoli'
    },
    {
      title: 'Peugeot 3008 SUV - Spacieux et confortable',
      description: 'Grand SUV familial avec toit panoramique, idéal pour les voyages. Places arrière très spacieuses.',
      type: 'suv', brand: 'Peugeot', model: '3008', year: 2021,
      seats: 5, transmission: 'auto', fuel: 'diesel',
      price_per_day: 65, city: 'Lyon', address: '8 Place Bellecour'
    },
    {
      title: 'Renault Zoé Électrique - Eco et pratique',
      description: 'Voiture 100% électrique, autonomie 300km. Parfaite pour la ville, borne de recharge incluse.',
      type: 'economy', brand: 'Renault', model: 'Zoé', year: 2023,
      seats: 5, transmission: 'auto', fuel: 'electric',
      price_per_day: 38, city: 'Paris', address: '22 Avenue des Champs-Élysées'
    },
    {
      title: 'Mercedes Classe E - Luxe et élégance',
      description: 'Berline de luxe parfaitement entretenue. Sièges chauffants, son premium, conduite assistée.',
      type: 'luxury', brand: 'Mercedes', model: 'Classe E', year: 2022,
      seats: 5, transmission: 'auto', fuel: 'petrol',
      price_per_day: 120, city: 'Nice', address: '5 Promenade des Anglais'
    },
    {
      title: 'Volkswagen Transporter - Van 9 places',
      description: 'Grand van idéal pour les groupes ou déménagements. 9 places assises, grand coffre.',
      type: 'van', brand: 'Volkswagen', model: 'Transporter', year: 2020,
      seats: 9, transmission: 'manual', fuel: 'diesel',
      price_per_day: 80, city: 'Marseille', address: '3 Quai du Port'
    },
    {
      title: 'Porsche 911 - Sportive d\'exception',
      description: 'Expérience de conduite unique. Sport + activé, Bose audio, sièges baquets sport.',
      type: 'sports', brand: 'Porsche', model: '911', year: 2021,
      seats: 2, transmission: 'auto', fuel: 'petrol',
      price_per_day: 250, city: 'Monaco', address: '1 Avenue des Spélugues'
    }
  ];

  for (const car of cars) {
    try {
      db.prepare(`
        INSERT INTO cars (owner_id, title, description, type, brand, model, year, seats, transmission, fuel, price_per_day, city, address, images)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]')
      `).run(owner.id, car.title, car.description, car.type, car.brand, car.model,
             car.year, car.seats, car.transmission, car.fuel, car.price_per_day, car.city, car.address);
    } catch (e) {
      // ignore duplicates
    }
  }

  console.log('✓ Demo cars created');
  console.log('\nDemo accounts:');
  console.log('  owner@test.com  / password123  (propriétaire)');
  console.log('  renter@test.com / password123  (locataire)');
  console.log('\nDone!');
}

seed().catch(console.error);
