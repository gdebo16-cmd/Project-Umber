const fs = require('fs');
const path = require('path');

const { sequelize, classes } = require('../models'); 

async function seedDatabase() {
    try {
        // 1. Authenticate and sync database tables
        await sequelize.authenticate();
        console.log('Database connection established.');

        // Force sync will drop and recreate tables (use caution in production!)
        await sequelize.sync({ force: true });
        console.log('Database synced.');

        // 2. Read the JSON file
        const filePath = path.join(__dirname, '../seedData/classes.json');
        const jsonData = fs.readFileSync(filePath, 'utf8');
        const classes = JSON.parse(jsonData);

        // 3. Loop and bulk insert into PostgreSQL
        for (const classItem of classes) {
            await DndClass.create({
                name: classItem.name,
                hitDice: classItem.hitDice,
                primaryAbility: classItem.primaryAbility,
                features: classItem.levels // Stored directly as JSONB in Postgres!
            });
            console.log(`Seeded class: ${classItem.name}`);
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();