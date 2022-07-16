export async function timeoutPromise<P>(promise: Promise<P>, timeout: number): Promise<P> {
  let timeoutTimer: NodeJS.Timeout;
  
  const result = await Promise.race([
    promise.catch(e => {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer)
      }
      throw e;
    }),
    new Promise<P>((_resolve, reject) => {
      timeoutTimer = setTimeout(() => reject(new Error(`Promise timed out after ${timeout / 1000}s`)), timeout)
    }),
  ]);

  // If the timeout is triggered, this line will never be reached
  clearTimeout(timeoutTimer!);

  return result
}
