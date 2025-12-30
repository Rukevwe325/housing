import { MigrationInterface, QueryRunner } from 'typeorm';

// Replace [TIMESTAMP] with the actual generated timestamp and append it.
export class RenameTripDestinationFields1765890009137 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('Applying migration: Renaming destination fields in "trips" table...');
        
        // Rename 'country' to 'toCountry'
        await queryRunner.renameColumn('trips', 'country', 'toCountry');
        
        // Rename 'state' to 'toState'
        await queryRunner.renameColumn('trips', 'state', 'toState');
        
        // Rename 'city' to 'toCity'
        await queryRunner.renameColumn('trips', 'city', 'toCity');
        
        console.log('Migration successful: Destination fields renamed to toCountry, toState, toCity.');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('Reverting migration: Restoring destination field names in "trips" table...');
        
        // Rename 'toCountry' back to 'country'
        await queryRunner.renameColumn('trips', 'toCountry', 'country');
        
        // Rename 'toState' back to 'state'
        await queryRunner.renameColumn('trips', 'toState', 'state');
        
        // Rename 'toCity' back to 'city'
        await queryRunner.renameColumn('trips', 'toCity', 'city');
        
        console.log('Revert successful.');
    }
}