import { Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { DataSource } from 'typeorm';

@Injectable()
export class GroupsService {
  constructor(private readonly dataSource: DataSource) { }
  async createGroup(name: string) {
    try {
      await this.dataSource
        .createQueryBuilder()
        .insert()
        .into("groups")
        .values({ name })
        .execute();
    } catch (error) {
      throw error;
    }
  }

  async getAllGroups() {
    try {
      return await this.dataSource
        .createQueryBuilder()
        .select("*")
        .from("groups", "g")
        .getRawMany();
    }
    catch (error) {
      throw error;
    }
  }

  async getGroupById(id: number) {
    try {
      return await this.dataSource
        .createQueryBuilder()
        .select("*")
        .from("groups", "g")
        .where("g.id = :id", { id })
        .getRawOne();
    }
    catch (error) {
      throw error;
    }
  }
}
