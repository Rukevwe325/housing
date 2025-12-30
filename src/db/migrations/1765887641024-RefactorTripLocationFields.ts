import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RefactorTripLocationFields1765887641024 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('Applying migration: Safely refactoring location fields in "trips" table...');
        
        // --- STEP 1: ADD NEW COLUMNS (Allowing NULL temporarily) ---

        await queryRunner.addColumn('trips', new TableColumn({
            name: 'country',
            type: 'varchar',
            length: '100', 
            isNullable: true, // 🚨 CRITICAL CHANGE: Start as nullable
        }));
        
        await queryRunner.addColumn('trips', new TableColumn({
            name: 'state',
            type: 'varchar',
            length: '100', 
            isNullable: true, // 🚨 CRITICAL CHANGE: Start as nullable
        }));
        
        await queryRunner.addColumn('trips', new TableColumn({
            name: 'city',
            type: 'varchar',
            length: '255', 
            isNullable: true, // 🚨 CRITICAL CHANGE: Start as nullable
        }));

        // --- STEP 2: POPULATE EXISTING ROWS (Set a default value for old data) ---
        // We will populate all existing NULL rows with 'Unknown' to pass the NOT NULL constraint check later.
        await queryRunner.query(
            `UPDATE "trips" SET "country" = 'Unknown', "state" = 'Unknown', "city" = 'Unknown' WHERE "country" IS NULL`
        );


        // --- STEP 3: ALTER COLUMNS TO NOT NULL ---

        await queryRunner.changeColumn('trips', 'country', new TableColumn({
            name: 'country',
            type: 'varchar',
            length: '100', 
            isNullable: false, // 🟢 Now enforce NOT NULL
        }));
        
        await queryRunner.changeColumn('trips', 'state', new TableColumn({
            name: 'state',
            type: 'varchar',
            length: '100', 
            isNullable: false, // 🟢 Now enforce NOT NULL
        }));
        
        await queryRunner.changeColumn('trips', 'city', new TableColumn({
            name: 'city',
            type: 'varchar',
            length: '255', 
            isNullable: false, // 🟢 Now enforce NOT NULL
        }));


        // --- STEP 4: DROP OLD COLUMN ---
        await queryRunner.dropColumn('trips', 'to'); 
        
        console.log('Migration successful: "to" replaced with country, state, and city.');
    }

    // The 'down' method remains mostly the same, as it deals with dropping/restoring columns.
    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('Reverting migration: Restoring "to" in "trips" table...');
        
        await queryRunner.dropColumn('trips', 'city');
        await queryRunner.dropColumn('trips', 'state');
        await queryRunner.dropColumn('trips', 'country');
        
        await queryRunner.addColumn('trips', new TableColumn({
            name: 'to',
            type: 'varchar',
            length: '255', 
            isNullable: false,
        }));
        
        console.log('Revert successful.');
    }
}