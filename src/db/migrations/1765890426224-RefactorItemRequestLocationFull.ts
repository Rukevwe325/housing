import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

// Ensure the class name matches your file's timestamp
export class RefactorItemRequestLocationFull1765890426224 implements MigrationInterface { 

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('Applying migration: Comprehensive location refactoring in "item_requests" table...');
        
        // --- PART 1: ADD ORIGIN FIELDS (FROM) ---
        // (This section was already successfully executed in the failed run, but must be here for safety/re-run)

        // Step 1: Add as nullable
        await queryRunner.addColumn('item_requests', new TableColumn({
            name: 'fromCountry', type: 'varchar', length: '100', isNullable: true, 
            comment: 'The country where the item is to be shipped/bought from.',
        }));
        await queryRunner.addColumn('item_requests', new TableColumn({
            name: 'fromState', type: 'varchar', length: '100', isNullable: true, 
            comment: 'The state/province where the item is to be shipped/bought from.',
        }));
        await queryRunner.addColumn('item_requests', new TableColumn({
            name: 'fromCity', type: 'varchar', length: '255', isNullable: true, 
            comment: 'The city where the item is to be shipped/bought from.',
        }));

        // Step 2: Populate existing rows with a placeholder
        await queryRunner.query(
            `UPDATE "item_requests" SET "fromCountry" = 'Unknown', "fromState" = 'Unknown', "fromCity" = 'Unknown' WHERE "fromCountry" IS NULL`
        );

        // Step 3: Alter to NOT NULL
        await queryRunner.changeColumn('item_requests', 'fromCountry', new TableColumn({
            name: 'fromCountry', type: 'varchar', length: '100', isNullable: false, 
        }));
        await queryRunner.changeColumn('item_requests', 'fromState', new TableColumn({
            name: 'fromState', type: 'varchar', length: '100', isNullable: false, 
        }));
        await queryRunner.changeColumn('item_requests', 'fromCity', new TableColumn({
            name: 'fromCity', type: 'varchar', length: '255', isNullable: false, 
        }));


        // --- PART 2: ADD DESTINATION FIELDS (TO) ---
        // These are brand new structured fields, replacing the single 'destination' column.

        // Step 1: Add as nullable
        await queryRunner.addColumn('item_requests', new TableColumn({
            name: 'toCountry', type: 'varchar', length: '100', isNullable: true, 
            comment: 'The country where the item is to be delivered.',
        }));
        await queryRunner.addColumn('item_requests', new TableColumn({
            name: 'toState', type: 'varchar', length: '100', isNullable: true, 
            comment: 'The state/province where the item is to be delivered.',
        }));
        await queryRunner.addColumn('item_requests', new TableColumn({
            name: 'toCity', type: 'varchar', length: '255', isNullable: true, 
            comment: 'The city where the item is to be delivered.',
        }));

        // Step 2: Populate existing rows with a placeholder
        // Note: For existing data, we cannot intelligently guess the split, so we must use 'Unknown'.
        await queryRunner.query(
            `UPDATE "item_requests" SET "toCountry" = 'Unknown', "toState" = 'Unknown', "toCity" = 'Unknown' WHERE "toCountry" IS NULL`
        );

        // Step 3: Alter to NOT NULL
        await queryRunner.changeColumn('item_requests', 'toCountry', new TableColumn({
            name: 'toCountry', type: 'varchar', length: '100', isNullable: false, 
        }));
        await queryRunner.changeColumn('item_requests', 'toState', new TableColumn({
            name: 'toState', type: 'varchar', length: '100', isNullable: false, 
        }));
        await queryRunner.changeColumn('item_requests', 'toCity', new TableColumn({
            name: 'toCity', type: 'varchar', length: '255', isNullable: false, 
        }));

        
        // --- PART 3: DROP OLD COLUMN ---
        // Now that the new fields exist and are constrained, we can drop the old single column.
        await queryRunner.dropColumn('item_requests', 'destination');
        
        console.log('Migration successful: Item Request table now fully structured.');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('Reverting migration: Restoring item_requests location fields...');

        // 1. Restore old 'destination' column
        await queryRunner.addColumn('item_requests', new TableColumn({
            name: 'destination',
            type: 'varchar',
            length: '255', 
            isNullable: false,
        }));
        
        // 2. Drop the new destination fields (toCountry, etc.)
        await queryRunner.dropColumn('item_requests', 'toCity');
        await queryRunner.dropColumn('item_requests', 'toState');
        await queryRunner.dropColumn('item_requests', 'toCountry');

        // 3. Drop origin fields (fromCountry, etc.)
        await queryRunner.dropColumn('item_requests', 'fromCity');
        await queryRunner.dropColumn('item_requests', 'fromState');
        await queryRunner.dropColumn('item_requests', 'fromCountry');
        
        console.log('Revert successful.');
    }
}