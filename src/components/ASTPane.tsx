import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
  } from "react";
  import { DataSet, Network } from "vis-network/standalone";
  
  /* AST blueprint types */
  export interface ASTNodeDef {
    id: number;
    node_id: number;
    label: string;
    line_no: number;
    char_no: number;
    start_line_no: number;
    start_char_no: number;
    end_line_no: number;
    end_char_no: number;
  }
  
  export interface ASTEdgeDef {
    from: number;
    to: number;
  }
  
  export interface ASTData {
    nodes: ASTNodeDef[];
    edges: ASTEdgeDef[];
  }
  
  export interface ASTPaneHandle {
    showNodes: (nodeIds: number[]) => void;
    focusNode: (nodeId: number) => void;
    clearFocus: () => void;
    resetGraph: () => void;
  }
  
  interface ASTPaneProps {
    astData: ASTData;
    onReady?: () => void;
    onNodeClick?: (node: ASTNodeDef) => void;
  }
  
  /* VS Code–like graph options */
  const graphOptions = {
    nodes: {
      shape: "dot",
      size: 10,
      color: {
        background: "#d4d4d4",
        border: "#3c3c3c",
      },
      font: {
        color: "#d4d4d4",
        size: 12,
        face: "JetBrains Mono, Fira Code, monospace",
      },
    },
    edges: {
      color: "#3c3c3c",
      arrows: {
        to: { enabled: true, scaleFactor: 0.5 },
      },
    },
    physics: {
      enabled: true,
      hierarchicalRepulsion: {
        nodeDistance: 150,
      },
    },
    layout: {
      hierarchical: {
        direction: "UD",
        sortMethod: "directed",
        nodeSpacing: 150,
        parentCentralization: true,
        shakeTowards: "roots",
      },
    },
  };

  const TARGET_NODE_MIN_SCALE = 1.25;
  const TARGET_NODE_MAX_SCALE = 3;

  const centerNodeInPane = (
    network: Network,
    viewport: HTMLDivElement | null,
    visId: number,
    scale: number
  ) => {
    if (viewport) {
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      if (width > 0 && height > 0) {
        network.setSize(`${width}px`, `${height}px`);
      }
    }

    network.stopSimulation();
    network.selectNodes([visId]);
    network.redraw();
    network.moveTo({
      position: network.getPosition(visId),
      scale,
      offset: { x: 0, y: 0 },
      animation: {
        duration: 500,
        easingFunction: "easeInOutQuad",
      },
    });
  };

  const ASTPane = forwardRef<ASTPaneHandle, ASTPaneProps>(
    ({ astData, onReady, onNodeClick }, ref) => {
      const [isFocusEnabled, setIsFocusEnabled] = useState(true);
      const [hasTargetNode, setHasTargetNode] = useState(false);
      const viewportRef = useRef<HTMLDivElement | null>(null);
      const containerRef = useRef<HTMLDivElement | null>(null);
      const networkRef = useRef<Network | null>(null);
  
      const nodes = useRef(new DataSet<any>());
      const edges = useRef(new DataSet<any>());
      const redrawFrameRef = useRef<number | null>(null);
      const focusedVisIdRef = useRef<number | null>(null);
      const isFocusEnabledRef = useRef(true);
      const hasRenderedNodesRef = useRef(false);
  
      /* Lookup maps */
      const nodeMap = useMemo(
        () => new Map(astData.nodes.map((n) => [n.id, n])),
        [astData.nodes]
      );

      const nodeMapRef = useRef(nodeMap);

      useEffect(() => {
        nodeMapRef.current = nodeMap;
      }, [nodeMap]);

      const nodeIdToVisId = useMemo(
        () =>
          new Map<number, number>(
            astData.nodes.map((n) => [n.node_id, n.id])
          ),
        [astData.nodes]
      );

      const outgoingEdgeMap = useMemo(
        () =>
          astData.edges.reduce<Map<number, ASTEdgeDef[]>>((acc, e) => {
            acc.set(e.from, [...(acc.get(e.from) ?? []), e]);
            return acc;
          }, new Map()),
        [astData.edges]
      );
      
      const incomingEdgeMap = useMemo(
        () =>
          astData.edges.reduce<Map<number, ASTEdgeDef[]>>((acc, e) => {
            acc.set(e.to, [...(acc.get(e.to) ?? []), e]);
            return acc;
          }, new Map()),
        [astData.edges]
      );
  
      /* Initialize network once */
      useEffect(() => {
        if (!containerRef.current || networkRef.current) return;
  
        networkRef.current = new Network(
          containerRef.current,
          { nodes: nodes.current, edges: edges.current },
          graphOptions
        );

        networkRef.current.on("stabilizationIterationsDone", () => {
          const network = networkRef.current;
          if (!network) return;

          network.redraw();
        });

        networkRef.current.on("animationFinished", () => {
          const network = networkRef.current;
          const viewport = viewportRef.current;
          const focusedVisId = focusedVisIdRef.current;
          if (
            !network ||
            !viewport ||
            focusedVisId === null ||
            !nodes.current.get(focusedVisId)
          ) {
            return;
          }

          const nodePosition = network.canvasToDOM(
            network.getPosition(focusedVisId)
          );
          const expectedX = viewport.clientWidth / 2;
          const expectedY = viewport.clientHeight / 2;
          const isCentered =
            Math.abs(nodePosition.x - expectedX) <= 2 &&
            Math.abs(nodePosition.y - expectedY) <= 2;

          if (!isCentered) {
            network.moveTo({
              position: network.getPosition(focusedVisId),
              scale: network.getScale(),
              offset: { x: 0, y: 0 },
              animation: false,
            });
            network.redraw();
          }
        });

        networkRef.current.on("click", (params) => {
          if (params.nodes.length === 0) {
            return;
          }

          const visId = params.nodes[0];
          const node = nodeMapRef.current.get(visId);

          console.log("Clicked node:", node);

          if (node) {
            onNodeClick?.(node);
          }
        });

        onReady?.();
      }, []);

      useEffect(() => {
        return () => {
          if (redrawFrameRef.current !== null) {
            window.cancelAnimationFrame(redrawFrameRef.current);
          }
        };
      }, []);

      useEffect(() => {
        hasRenderedNodesRef.current = false;
        nodes.current.clear();
        edges.current.clear();
        networkRef.current?.unselectAll();
      }, [astData]);
  
      /* Expose imperative API */
      useImperativeHandle(ref, () => ({
        resetGraph() {
          focusedVisIdRef.current = null;
          setHasTargetNode(false);
          hasRenderedNodesRef.current = false;
          nodes.current.clear();
          edges.current.clear();
          networkRef.current?.unselectAll();
        },
        clearFocus() {
          focusedVisIdRef.current = null;
          setHasTargetNode(false);
          networkRef.current?.unselectAll();
        },
        showNodes(nodeIds: number[]) {
          const network = networkRef.current;
          const visibleVisIds = new Set<number>();
          const shouldFitInitialNodes =
            !hasRenderedNodesRef.current && nodeIds.length > 0;
          const previousScale = network?.getScale() ?? 1;
          const previousPosition = network?.getViewPosition() ?? {
            x: 0,
            y: 0,
          };

          focusedVisIdRef.current = null;
          setHasTargetNode(false);
          nodes.current.clear();
          edges.current.clear();
          network?.unselectAll();

          nodeIds.forEach((nodeId) => {
            const visId = nodeIdToVisId.get(nodeId);
            if (visId === undefined || visibleVisIds.has(visId)) {
              return;
            }

            const def = nodeMapRef.current.get(visId);
            if (!def) {
              return;
            }

            visibleVisIds.add(visId);
            nodes.current.add({
              id: visId,
              label: def.label,
              line_no: def.line_no,
              char_no: def.char_no,
            });
          });

          visibleVisIds.forEach((visId) => {
            (outgoingEdgeMap.get(visId) ?? []).forEach((edge) => {
              if (!visibleVisIds.has(edge.to)) return;
              const edgeId = `${edge.from}->${edge.to}`;
              if (!edges.current.get(edgeId)) {
                edges.current.add({ id: edgeId, from: edge.from, to: edge.to });
              }
            });

            (incomingEdgeMap.get(visId) ?? []).forEach((edge) => {
              if (!visibleVisIds.has(edge.from)) return;
              const edgeId = `${edge.from}->${edge.to}`;
              if (!edges.current.get(edgeId)) {
                edges.current.add({ id: edgeId, from: edge.from, to: edge.to });
              }
            });
          });

          if (!network) return;

          if (redrawFrameRef.current !== null) {
            window.cancelAnimationFrame(redrawFrameRef.current);
          }

          redrawFrameRef.current = window.requestAnimationFrame(() => {
            redrawFrameRef.current = null;
            network.redraw();

            if (shouldFitInitialNodes) {
              network.fit({
                animation: false,
              });
            } else {
              network.moveTo({
                position: previousPosition,
                scale: previousScale,
                animation: false,
              });
            }

            hasRenderedNodesRef.current = nodeIds.length > 0;
            network.stabilize(30);

            const focusedVisId = focusedVisIdRef.current;
            if (
              focusedVisId !== null &&
              nodes.current.get(focusedVisId) &&
              isFocusEnabledRef.current
            ) {
              centerNodeInPane(
                network,
                viewportRef.current,
                focusedVisId,
                network.getScale()
              );
            }
          });
        },
        focusNode(nodeId: number) {
          const visId = nodeIdToVisId.get(nodeId);
          if (visId === undefined || !nodes.current.get(visId)) return;

          const network = networkRef.current;
          if (!network) return;

          focusedVisIdRef.current = visId;
          setHasTargetNode(true);
          network.selectNodes([visId]);

          if (!isFocusEnabledRef.current) {
            return;
          }

          // showNodes schedules fit() on the next frame. Let that finish before
          // panning, otherwise fit() immediately overwrites this focus request.
          if (redrawFrameRef.current !== null) {
            return;
          }

          centerNodeInPane(
            network,
            viewportRef.current,
            visId,
            network.getScale()
          );
        },
      }));
  
      return (
        <div className="h-full min-h-0 overflow-hidden flex flex-col font-mono text-sm text-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 bg-neutral-800 p-1 border-b border-neutral-700">
            <div>
              <h2 className="font-semibold text-gray-100">AST</h2>
              <p className="text-xs text-gray-400">
                Nodes appear as they are created
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-pressed={isFocusEnabled}
                className={`rounded-sm border px-2 py-1 text-xs transition-colors ${
                  isFocusEnabled
                    ? "border-blue-500 bg-blue-950/60 text-blue-200"
                    : "border-neutral-600 bg-neutral-900 text-gray-400"
                }`}
                onClick={() => {
                  const nextValue = !isFocusEnabledRef.current;
                  isFocusEnabledRef.current = nextValue;
                  setIsFocusEnabled(nextValue);

                  if (!nextValue) return;

                  const network = networkRef.current;
                  const focusedVisId = focusedVisIdRef.current;
                  if (
                    network &&
                    focusedVisId !== null &&
                    nodes.current.get(focusedVisId)
                  ) {
                    centerNodeInPane(
                      network,
                      viewportRef.current,
                      focusedVisId,
                      network.getScale()
                    );
                  }
                }}
              >
                Focus: {isFocusEnabled ? "ON" : "OFF"}
              </button>
              <button
                type="button"
                className="rounded-sm border border-neutral-600 bg-neutral-900 px-2 py-1 text-xs text-gray-300 transition-colors hover:border-neutral-400 hover:text-gray-100 disabled:cursor-default disabled:opacity-40"
                disabled={!hasTargetNode}
                onClick={() => {
                  const network = networkRef.current;
                  const focusedVisId = focusedVisIdRef.current;
                  if (
                    !network ||
                    focusedVisId === null ||
                    !nodes.current.get(focusedVisId)
                  ) {
                    return;
                  }

                  const targetScale = Math.min(
                    Math.max(
                      network.getScale() * 1.35,
                      TARGET_NODE_MIN_SCALE
                    ),
                    TARGET_NODE_MAX_SCALE
                  );
                  centerNodeInPane(
                    network,
                    viewportRef.current,
                    focusedVisId,
                    targetScale
                  );
                }}
              >
                Go to target
              </button>
            </div>
          </div>
  
          {/* Graph */}
          <div
            ref={viewportRef}
            className="relative mt-2 min-h-0 flex-1 overflow-hidden bg-neutral-900 border border-neutral-700"
          >
            <div ref={containerRef} className="absolute inset-0" />
          </div>
        </div>
      );
    }
  );
  
  export default ASTPane;
  
