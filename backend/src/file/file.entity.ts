import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Files {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: false })
    tableName: string;

    @Column({ nullable: false })
    summary: string;
}
