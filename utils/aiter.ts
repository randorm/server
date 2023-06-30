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

export async function* aichunk<T>(
  iterable: AsyncIterable<T>,
  size: number,
): AsyncIterable<T[]> {
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error("Sample size must be a positive integer");
  }

  let chunk = [];
  for await (const value of iterable) {
    chunk.push(value);

    if (chunk.length === size) {
      yield chunk;

      chunk = [];
    }
  }

  if (chunk.length) yield chunk;
}

export async function achunk<T>(
  iterable: AsyncIterable<T>,
  size: number,
): Promise<T[][]> {
  return await toArray(aichunk(iterable, size));
}
