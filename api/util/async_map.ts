export async function asyncMap<T, U = T>(
  callback: (value: T) => U | Promise<U>,
  iterable: AsyncIterableIterator<T>,
): Promise<U[]> {
  const results = [];
  for await (const value of iterable) {
    const result = await callback(value);

    results.push(result);
  }

  return results;
}
