import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('queries')
export class Queries {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tableId: number;

    @Column()
    userQuery: string;

    @Column()
    query: string;

    @Column()
    queryType: string;
}

@Entity('group_queries')
export class GroupQuery {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    groupId: number;

    @Column()
    userQuery: string;

    @Column()
    query: string;

    @Column()
    queryType: string;
}
