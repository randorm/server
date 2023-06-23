export async function* aimap<T, U = T>(
  transformer: (value: T) => U | Promise<U>,
  iterable: AsyncIterable<T>,
): AsyncIterable<U> {
  for await (const value of iterable) {
    yield await transformer(value);
  }
}

export async function toArray<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const values = [];
  for await (const value of iterable) {
    values.push(value);
  }

  return values;
}

export async function amap<T, U = T>(
  transformer: (value: T) => U | Promise<U>,
  iterable: AsyncIterable<T>,
): Promise<U[]> {
  return await toArray(aimap(transformer, iterable));
}