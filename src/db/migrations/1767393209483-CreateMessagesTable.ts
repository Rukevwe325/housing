import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateMessagesTable1767393209483 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create the 'messages' table
        await queryRunner.createTable(
            new Table({
                name: 'messages',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'matchId',
                        type: 'int',
                        isNullable: false,
                    },
                    {
                        name: 'senderId',
                        type: 'uuid', // Using uuid as per your user system
                        isNullable: false,
                    },
                    {
                        name: 'content',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'isRead',
                        type: 'boolean',
                        default: false,
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

        // 2. Create Foreign Key to matches table
        await queryRunner.createForeignKey(
            'messages',
            new TableForeignKey({
                columnNames: ['matchId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'matches',
                onDelete: 'CASCADE',
            }),
        );

        // 3. Create Foreign Key to users table
        await queryRunner.createForeignKey(
            'messages',
            new TableForeignKey({
                columnNames: ['senderId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Retrieve the table safely to avoid TS18048 error
        const table = await queryRunner.getTable('messages');

        if (table) {
            // Drop the Foreign Keys manually as per your style
            const matchFk = table.foreignKeys.find(fk => fk.columnNames.indexOf('matchId') !== -1);
            if (matchFk) await queryRunner.dropForeignKey('messages', matchFk);

            const senderFk = table.foreignKeys.find(fk => fk.columnNames.indexOf('senderId') !== -1);
            if (senderFk) await queryRunner.dropForeignKey('messages', senderFk);

            // Drop the table
            await queryRunner.dropTable('messages');
        }
    }
}