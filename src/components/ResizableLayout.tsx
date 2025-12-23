import { FC, ReactNode, useState } from "react";
import Split from "react-split";

interface ResizableLayoutProps {
  left: ReactNode;
  topLeft: ReactNode;
  topRight: ReactNode;
  bottomLeft: ReactNode;
  bottomRight: ReactNode;
}

const ResizableLayout: FC<ResizableLayoutProps> = ({
  left,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}) => {
  const [showTopLeft, setShowTopLeft] = useState(true);
  const [showTopRight, setShowTopRight] = useState(true);
  const [showBottomLeft, setShowBottomLeft] = useState(true);
  const [showBottomRight, setShowBottomRight] = useState(true);

  const visibleTopPanels = [showTopLeft, showTopRight].filter(Boolean).length || 1;
  const visibleBottomPanels = [showBottomLeft, showBottomRight].filter(Boolean).length || 1;

  return (
    <div className="h-full w-full relative">

      {/* Panel Toggle Buttons */}
      {/* <div className="absolute top-2 right-2 z-50 flex gap-2 text-xs">
        <button className="border px-2 py-1 bg-white" onClick={() => setShowTopLeft(!showTopLeft)}>
          TL
        </button>
        <button className="border px-2 py-1 bg-white" onClick={() => setShowTopRight(!showTopRight)}>
          TR
        </button>
        <button className="border px-2 py-1 bg-white" onClick={() => setShowBottomLeft(!showBottomLeft)}>
          BL
        </button>
        <button className="border px-2 py-1 bg-white" onClick={() => setShowBottomRight(!showBottomRight)}>
          BR
        </button>
      </div> */}

      <Split
        sizes={[40, 60]}
        minSize={200}
        gutterSize={8}
        className="split-horizontal flex h-full"
      >
        <div className="pane h-full">{left}</div>

        <Split
          direction="vertical"
          sizes={[50, 50]}
          minSize={80}
          gutterSize={8}
          className="split-vertical h-full"
        >
          {/* TOP ROW */}
          <Split
            sizes={Array(visibleTopPanels).fill(100 / visibleTopPanels)}
            minSize={80}
            gutterSize={8}
            className="flex h-full"
          >
            {showTopLeft && <div className="pane h-full">{topLeft}</div>}
            {showTopRight && <div className="pane h-full">{topRight}</div>}
          </Split>

          {/* BOTTOM ROW */}
          {showBottomLeft && <div className="pane h-full">{bottomLeft}</div>}
          {/* <Split
            sizes={Array(visibleBottomPanels).fill(100 / visibleBottomPanels)}
            minSize={80}
            gutterSize={8}
            className="flex h-full"
          >
            {showBottomRight && <div className="pane h-full">{bottomRight}</div>}
          </Split> */}
        </Split>
      </Split>
    </div>
  );
};

export default ResizableLayout;
