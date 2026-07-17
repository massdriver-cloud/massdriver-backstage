import { useCallback, useState, type RefObject } from 'react';
import { toPng } from 'html-to-image';

const EXCLUDED_CLASSES = [
  'react-flow__controls',
  'react-flow__minimap',
  'react-flow__panel',
];

const excludeChrome = (node: HTMLElement) =>
  !EXCLUDED_CLASSES.some(name => node?.classList?.contains(name));

export const useDiagramSnapshot = ({
  wrapperRef,
  fileNameBase,
}: {
  wrapperRef: RefObject<HTMLElement>;
  fileNameBase: string;
}) => {
  const [isSnapshotting, setIsSnapshotting] = useState(false);

  const onSnapshotClick = useCallback(async () => {
    const wrapper = wrapperRef?.current;
    if (!wrapper) return;

    setIsSnapshotting(true);
    try {
      const dataUrl = await toPng(wrapper, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        filter: excludeChrome,
      });

      const link = document.createElement('a');
      link.setAttribute(
        'download',
        `${fileNameBase}-diagram-snapshot-${new Date().toISOString()}.png`,
      );
      link.setAttribute('href', dataUrl);
      link.click();
      link.remove();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unable to download diagram snapshot.', error);
    } finally {
      setIsSnapshotting(false);
    }
  }, [wrapperRef, fileNameBase]);

  return { onSnapshotClick, isSnapshotting };
};

export default useDiagramSnapshot;
