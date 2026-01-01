import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
  } from "react";
  import { DataSet, Network } from "vis-network/standalone";
  
  /* AST blueprint types */
  interface ASTNodeDef {
    id: number;
    node_id: number;
    label: string;
  }
  
  interface ASTEdgeDef {
    from: number;
    to: number;
  }
  
  interface ASTData {
    nodes: ASTNodeDef[];
    edges: ASTEdgeDef[];
  }
  
  export interface ASTPaneHandle {
    enableNode: (nodeId: number) => void;
  }
  
  interface ASTPaneProps {
    astData: ASTData;
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
    ({ astData }, ref) => {
      const containerRef = useRef<HTMLDivElement | null>(null);
      const networkRef = useRef<Network | null>(null);
  
      const nodes = useRef(new DataSet<any>());
      const edges = useRef(new DataSet<any>());
  
      /* Lookup maps */
      const nodeMap = useMemo(
        () => new Map(astData.nodes.map((n) => [n.node_id, n])),
        [astData.nodes]
      );
      
  
      const edgeMap = useMemo(
        () =>
          astData.edges.reduce<Map<number, ASTEdgeDef[]>>((acc, e) => {
            acc.set(e.from, [...(acc.get(e.from) ?? []), e]);
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
      }, []);
  
      /* Expose imperative API */
      useImperativeHandle(ref, () => ({
        enableNode(nodeId: number) {
          if (nodes.current.get(nodeId)) return;
        
          const def = nodeMap.get(nodeId);
          if (!def) return;
        
          nodes.current.add({
            id: def.node_id,
            label: def.label,
            bfsIndex: def.id,   // metadata only
          });
        
          const relatedEdges = edgeMap.get(nodeId) ?? [];
          relatedEdges.forEach((e) => {
            if (nodes.current.get(e.from) && nodes.current.get(e.to)) {
              const edgeId = `${e.from}->${e.to}`;
              if (!edges.current.get(edgeId)) {
                edges.current.add({
                  id: edgeId,
                  from: e.from,
                  to: e.to,
                });
              }
            }
          });
        
          const network = networkRef.current;
          if (!network) return;
        
          // 🔑 PAN ONLY — never touch scale
          const pos = network.getPositions([nodeId])[nodeId];
          if (!pos) return;
        
          network.moveTo({
            position: pos,
            animation: {
              duration: 300,
              easingFunction: "easeInOutQuad",
            },
          });
        
          network.selectNodes([nodeId]);
        }
        
        
        
        ,
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
  