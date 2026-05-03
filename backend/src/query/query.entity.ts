import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('queries')
export class Queries {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tableName: string;

    @Column()
    userQuery: string;

    @Column()
    query: string;

    @Column()
    queryType: string;
}
