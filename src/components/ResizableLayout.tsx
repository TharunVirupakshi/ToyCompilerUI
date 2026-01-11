import { FC, ReactNode, useState } from "react";
import Split from "react-split";

interface ResizableLayoutProps {
  leftTop: ReactNode;     // Editor
  leftBottom: ReactNode;  // Parser States (placeholder)
  topLeft: ReactNode;
  topRight: ReactNode;
  bottomLeft: ReactNode;
  bottomRight?: ReactNode;
}

const ResizableLayout: FC<ResizableLayoutProps> = ({
  leftTop,
  leftBottom,
  topLeft,
  topRight,
  bottomLeft,
}) => {
  return (
    <div className="h-full w-full">

      {/* OUTER: Left / Right */}
      <Split
        sizes={[40, 60]}
        minSize={200}
        gutterSize={8}
        className="flex h-full"
      >
        {/* LEFT COLUMN (Editor + Parser States) */}
        <Split
          direction="vertical"
          sizes={[70, 30]}
          minSize={100}
          gutterSize={8}
          className="flex flex-col h-full"
        >
          <div className="pane h-full">
            {leftTop}
          </div>

          <div className="pane h-full bg-neutral-900 border-t border-neutral-700">
            {leftBottom}
          </div>
        </Split>

        {/* RIGHT COLUMN */}
        <Split
          direction="vertical"
          sizes={[50, 50]}
          minSize={120}
          gutterSize={8}
          className="flex flex-col h-full"
        >
          {/* TOP RIGHT ROW */}
          <Split
            sizes={[50, 50]}
            minSize={120}
            gutterSize={8}
            className="flex h-full"
          >
            <div className="pane h-full">{topLeft}</div>
            <div className="pane h-full">{topRight}</div>
          </Split>

          {/* BOTTOM RIGHT */}
          <div className="pane h-full">{bottomLeft}</div>
        </Split>
      </Split>
    </div>
  );
};

export default ResizableLayout;
