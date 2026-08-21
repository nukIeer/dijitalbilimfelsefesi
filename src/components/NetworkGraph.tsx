import { useEffect, useRef } from 'react';
import { Network, Options, Edge, Node } from 'vis-network';
import 'vis-network/styles/vis-network.css';

interface NetworkGraphProps {
  nodes: any[];
  edges: any[];
}

export default function NetworkGraph({ nodes, edges }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Formatting nodes according to Design Spec
    // Red for concept, Grey for author
    const formattedNodes: Node[] = (nodes || []).map(node => {
      const isConcept = node.type === 'concept' || String(node.group).toLowerCase() === 'concept';
      const isAuthor = node.type === 'author' || String(node.group).toLowerCase() === 'author';
      
      let color = {
        background: '#ffffff',
        border: '#e5e7eb',
        highlight: { background: '#ffffff', border: '#9ca3af' },
      };

      if (isConcept) {
        color = {
          background: 'rgba(227, 10, 23, 0.1)',
          border: '#E30A17',
          highlight: { background: 'rgba(227, 10, 23, 0.2)', border: '#E30A17' },
        };
      } else if (isAuthor) {
         color = {
          background: '#f9fafb',
          border: '#9ca3af',
          highlight: { background: '#f3f4f6', border: '#6b7280' },
        };
      } else {
         // Fallback based on colors if standard type doesn't exist but has id
         color = {
           background: '#f9fafb',
           border: '#d1d5db',
           highlight: { background: '#f3f4f6', border: '#9ca3af' },
         };
      }

      return {
        id: node.id,
        label: node.label || String(node.id),
        shape: 'dot',
        size: isConcept ? 24 : 16,
        color,
        font: {
          face: 'Inter, ui-sans-serif, system-ui',
          size: 12,
          color: '#374151'
        },
        borderWidth: 2,
      };
    });

    const formattedEdges: Edge[] = (edges || []).map(edge => ({
      ...edge,
      color: { color: '#e5e7eb', highlight: '#E30A17' },
      width: 1,
      hoverWidth: 2,
      smooth: { type: 'continuous' }
    }));

    const data = {
      nodes: formattedNodes,
      edges: formattedEdges,
    };

    const options: Options = {
      physics: {
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 100,
          springConstant: 0.08,
        },
        maxVelocity: 50,
        solver: 'forceAtlas2Based',
        timestep: 0.35,
        stabilization: { iterations: 150 }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
      },
      layout: {
        improvedLayout: true
      }
    };

    networkRef.current = new Network(containerRef.current, data, options);

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
      }
    };
  }, [nodes, edges]);

  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F5F5F7]">
        Ağ analizi verisi bulunamadı.
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="h-full w-full absolute inset-0 bg-transparent transition-opacity"
    />
  );
}
