export type Bounding = {
  x0: number;
  y0: number;
  width: number;
  height: number;
};

export function euclideanDistance(rect1: Bounding, rect2: Bounding): number {
  const xDiff = rect1.x0 + rect1.width / 2 - (rect2.x0 + rect2.width / 2);
  const yDiff = rect1.y0 + rect1.height / 2 - (rect2.y0 + rect2.height / 2);
  const widthDiff = rect1.width - rect2.width;
  const heightDiff = rect1.height - rect2.height;
  return Math.sqrt(xDiff ** 2 + yDiff ** 2 + widthDiff ** 2 + heightDiff ** 2);
}
