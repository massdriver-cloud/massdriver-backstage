import { useMemo } from 'react';

const toRadians = (angle: number) => angle * (Math.PI / 180);

interface RadialArgs {
  startAngle: number;
  endAngle: number;
  radius: number;
  numItems: number;
  originX?: number;
  originY?: number;
}

export interface RadialPosition {
  xPos: number;
  yPos: number;
}

const calcPositions = ({
  startAngle,
  endAngle,
  radius,
  numItems,
  originX = 0,
  originY = 0,
}: RadialArgs): RadialPosition[] => {
  if (numItems <= 1) return [];
  const angleStep = (endAngle - startAngle) / (numItems - 1);
  return Array.from({ length: numItems }, (_unused, index) => {
    const angle = startAngle + angleStep * index;
    const x = radius * Math.cos(toRadians(angle));
    const y = radius * Math.sin(toRadians(angle));
    return {
      xPos: originX - Number(x.toFixed(2)),
      yPos: originY - Number(y.toFixed(2)),
    };
  });
};

const useRadialPositions = (
  { startAngle, endAngle, radius, numItems, originX, originY }: RadialArgs,
  { skip }: { skip?: boolean } = {},
): RadialPosition[] | undefined =>
  useMemo(
    () =>
      skip
        ? undefined
        : calcPositions({
            startAngle,
            endAngle,
            radius,
            numItems,
            originX,
            originY,
          }),
    [skip, startAngle, endAngle, radius, numItems, originX, originY],
  );

export default useRadialPositions;
