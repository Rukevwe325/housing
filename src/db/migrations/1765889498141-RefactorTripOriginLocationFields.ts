import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

// Replace [TIMESTAMP] with the actual generated timestamp and append it to the class name.
export class RefactorTripOriginLocationFields1765889498141 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('Applying migration: Refactoring "from" column to structured origin fields in "trips" table...');
        
        // --- STEP 1: ADD NEW COLUMNS (Allowing NULL temporarily) ---
        
        await queryRunner.addColumn('trips', new TableColumn({
            name: 'fromCountry',
            type: 'varchar',
            length: '100', 
            isNullable: true, 
            comment: 'The country of origin for the trip.',
        }));
        
        await queryRunner.addColumn('trips', new TableColumn({
            name: 'fromState',
            type: 'varchar',
            length: '100', 
            isNullable: true, 
            comment: 'The state/province of origin for the trip.',
        }));
        
        await queryRunner.addColumn('trips', new TableColumn({
            name: 'fromCity',
            type: 'varchar',
            length: '255', 
            isNullable: true, 
            comment: 'The city of origin for the trip.',
        }));

        // --- STEP 2: POPULATE EXISTING ROWS (Set a default value for old data) ---
        // Fills existing NULL rows with 'Unknown' to pass the NOT NULL constraint later.
        await queryRunner.query(
            `UPDATE "trips" SET "fromCountry" = 'Unknown', "fromState" = 'Unknown', "fromCity" = 'Unknown' WHERE "fromCountry" IS NULL`
        );


        // --- STEP 3: ALTER COLUMNS TO NOT NULL ---

        await queryRunner.changeColumn('trips', 'fromCountry', new TableColumn({
            name: 'fromCountry',
            type: 'varchar',
            length: '100', 
            isNullable: false, // Enforce NOT NULL
        }));
        
        await queryRunner.changeColumn('trips', 'fromState', new TableColumn({
            name: 'fromState',
            type: 'varchar',
            length: '100', 
            isNullable: false, // Enforce NOT NULL
        }));
        
        await queryRunner.changeColumn('trips', 'fromCity', new TableColumn({
            name: 'fromCity',
            type: 'varchar',
            length: '255', 
            isNullable: false, // Enforce NOT NULL
        }));


        // --- STEP 4: DROP OLD COLUMN ---
        await queryRunner.dropColumn('trips', 'from'); 
        
        console.log('Migration successful: "from" replaced with structured origin fields.');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('Reverting migration: Restoring "from" in "trips" table...');
        
        // 1. Drop the new columns
        await queryRunner.dropColumn('trips', 'fromCity');
        await queryRunner.dropColumn('trips', 'fromState');
        await queryRunner.dropColumn('trips', 'fromCountry');
        
        // 2. Restore the old 'from' column (assuming it was varchar(255) and NOT NULL)
        await queryRunner.addColumn('trips', new TableColumn({
            name: 'from',
            type: 'varchar',
            length: '255', 
            isNullable: false,
        }));
        
        console.log('Revert successful.');
    }
}