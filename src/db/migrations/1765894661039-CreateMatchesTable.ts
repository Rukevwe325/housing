import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateMatchesTable1672531200000 implements MigrationInterface {

    // Define the ENUM values to be used by the database
    private readonly MatchStatusEnum = ['pending', 'interested', 'accepted', 'rejected', 'completed', 'canceled'];

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create the 'matches' table
        await queryRunner.createTable(
            new Table({
                name: 'matches',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'itemRequestId',
                        type: 'int',
                        isNullable: false,
                    },
                    {
                        name: 'tripId',
                        type: 'int',
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: this.MatchStatusEnum, // The lifecycle status
                        default: `'pending'`, // Initial status
                    },
                    {
                        name: 'agreedWeightKg',
                        type: 'decimal',
                        precision: 5,
                        scale: 2,
                        isNullable: true, 
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP', 
                    },
                ],
            }),
            true,
        );

        // 2. Create Foreign Key to item_requests table
        await queryRunner.createForeignKey(
            'matches',
            new TableForeignKey({
                columnNames: ['itemRequestId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'item_requests',
                onDelete: 'CASCADE', 
            }),
        );
        
        // 3. Create Foreign Key to trips table
        await queryRunner.createForeignKey(
            'matches',
            new TableForeignKey({
                columnNames: ['tripId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'trips',
                onDelete: 'CASCADE', 
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Retrieve the table safely to avoid TS18048 error
        const table = await queryRunner.getTable('matches');
        
        // Only attempt to drop keys and table if the table exists
        if (table) {
            // Drop the Foreign Keys
            const itemRequestFk = table.foreignKeys.find(fk => fk.columnNames.indexOf('itemRequestId') !== -1);
            if (itemRequestFk) await queryRunner.dropForeignKey('matches', itemRequestFk);

            const tripFk = table.foreignKeys.find(fk => fk.columnNames.indexOf('tripId') !== -1);
            if (tripFk) await queryRunner.dropForeignKey('matches', tripFk);
            
            // Drop the table
            await queryRunner.dropTable('matches');
        }
    }
}