import { BadRequestException } from '@nestjs/common';

export function validateTableName(tableName: string): string {
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    throw new BadRequestException('Invalid table name');
  }
  return tableName;
}
