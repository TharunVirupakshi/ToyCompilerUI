import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
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
  
  const ASTPane = forwardRef<ASTPaneHandle, ASTPaneProps>(
    ({ astData, onReady, onNodeClick }, ref) => {
      const containerRef = useRef<HTMLDivElement | null>(null);
      const networkRef = useRef<Network | null>(null);
  
      const nodes = useRef(new DataSet<any>());
      const edges = useRef(new DataSet<any>());
      const redrawFrameRef = useRef<number | null>(null);
  
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
          networkRef.current?.redraw();
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
        nodes.current.clear();
        edges.current.clear();
        networkRef.current?.unselectAll();
      }, [astData]);
  
      /* Expose imperative API */
      useImperativeHandle(ref, () => ({
        resetGraph() {
          nodes.current.clear();
          edges.current.clear();
          networkRef.current?.unselectAll();
        },
        showNodes(nodeIds: number[]) {
          const network = networkRef.current;
          const visibleVisIds = new Set<number>();

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
            network.fit({
              animation: false,
            });
            network.stabilize(30);
          });
        },
        focusNode(nodeId: number) {
          const visId = nodeIdToVisId.get(nodeId);
          if (visId === undefined || !nodes.current.get(visId)) return;

          const network = networkRef.current;
          if (!network) return;

          network.focus(visId, {
            scale: 1,
            animation: { duration: 300, easingFunction: "easeInOutQuad" },
          });
          network.selectNodes([visId]);
        },
      }));
  
      return (
        <div className="h-full flex flex-col font-mono text-sm text-gray-200">
          {/* Header */}
          <div className="bg-neutral-800 p-1 border-b border-neutral-700">
            <h2 className="font-semibold text-gray-100">AST</h2>
            <p className="text-xs text-gray-400">
              Nodes appear as they are created
            </p>
          </div>
  
          {/* Graph */}
          <div className="flex-1 bg-neutral-900 border border-neutral-700 mt-2">
            <div ref={containerRef} className="h-full w-full" />
          </div>
        </div>
      );
    }
  );
  
  export default ASTPane;
  
