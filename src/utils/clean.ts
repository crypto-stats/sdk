export function clean(value: any): any {
  const type = typeof value;

  if (
    value === null
    || type === 'boolean'
    || type === 'number'
    || type === 'string'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(clean);
  }

  const result: any = {};
  for (const key in value) {
    result[key] = clean(value[key]);
  }
  return result;
}
