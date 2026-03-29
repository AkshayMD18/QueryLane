export function mapSqliteType(type: string): string {
    const t = type.toLowerCase();

    if (t.includes('int')) return 'number';
    if (t.includes('real') || t.includes('float') || t.includes('double')) return 'number';
    if (t.includes('text')) return 'string';
    if (t.includes('bool')) return 'boolean';
    if (t.includes('date') || t.includes('time')) return 'date';

    return 'string'; // fallback
}