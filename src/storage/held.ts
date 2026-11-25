/** For the fakes: a wait that ends when it is told to. */
export function held() {
  let release = () => {};
  const until = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { until, release };
}
