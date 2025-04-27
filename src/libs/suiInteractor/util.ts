export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const batch = <T>(arr: T[], size: number): T[][] => {
  const batches = [];
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size));
  }
  return batches;
};
