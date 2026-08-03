import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tables')
export class TableEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: false })
    tableName: string;

    @Column({ nullable: false })
    summary: string;

    @Column({ nullable: false })
    groupId: number;
}
