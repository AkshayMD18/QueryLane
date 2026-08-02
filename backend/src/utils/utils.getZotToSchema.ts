import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';
export function getCleanJsonSchema(zodSchema: z.ZodType<any>) {
  // Convert Zod to JSON schema
  const jsonSchema = zodToJsonSchema(zodSchema as any) as any;

  // Remove the $schema key that strict providers reject
  delete jsonSchema.$schema;

  return jsonSchema;
}