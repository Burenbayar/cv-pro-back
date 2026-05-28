import {useEffect, useRef, useState, type ReactNode} from 'react';

/** Matches `min-w-[760px]` on CvTemplateDocument */
const DESIGN_WIDTH = 760;

type CvScaledPreviewProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Fits desktop CV layout into narrow viewports via CSS scale (layout stays intact).
 */
export function CvScaledPreview({children, className = ''}: CvScaledPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const updateScale = () => {
      const w = container.clientWidth;
      if (w > 0) setScale(Math.min(1, w / DESIGN_WIDTH));
    };

    const updateHeight = () => {
      setContentHeight(content.offsetHeight);
    };

    updateScale();
    updateHeight();

    const roContainer = new ResizeObserver(updateScale);
    const roContent = new ResizeObserver(updateHeight);
    roContainer.observe(container);
    roContent.observe(content);

    return () => {
      roContainer.disconnect();
      roContent.disconnect();
    };
  }, []);

  const visualHeight = contentHeight > 0 ? contentHeight * scale : undefined;

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <div
        className="mx-auto overflow-hidden"
        style={{
          width: scale < 1 ? DESIGN_WIDTH * scale : DESIGN_WIDTH,
          height: visualHeight,
          maxWidth: '100%',
        }}
      >
        <div
          ref={contentRef}
          className="origin-top-left"
          style={{
            width: DESIGN_WIDTH,
            transform: scale < 1 ? `scale(${scale})` : undefined,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
