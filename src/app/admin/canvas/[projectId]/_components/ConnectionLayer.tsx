'use client';

import type { CanvasNode, CanvasConnection } from '../page';

interface ConnectionLayerProps {
  nodes: CanvasNode[];
  connections: CanvasConnection[];
  selectedNodeId: string | null;
  activeChainNodeIds?: Set<string>;
}

export function ConnectionLayer({ nodes, connections, selectedNodeId, activeChainNodeIds }: ConnectionLayerProps) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <defs>
        <filter id="conn-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {connections.map((conn, i) => {
        const fromNode = nodeMap.get(conn.from_node_id);
        const toNode = nodeMap.get(conn.to_node_id);
        if (!fromNode || !toNode) return null;

        // Width depends on node type: 180px for step nodes, 220px for feature nodes
        const fromWidth = fromNode.node_type === 'step' ? 180 : 220;
        const toHeight = toNode.node_type === 'step' ? 50 : 60;
        const fromHeight = fromNode.node_type === 'step' ? 50 : 60;

        const fromX = fromNode.x + fromWidth;
        const fromY = fromNode.y + fromHeight;
        const toX = toNode.x;
        const toY = toNode.y + toHeight;

        const path = `M ${fromX} ${fromY} C ${fromX + 60} ${fromY}, ${toX - 60} ${toY}, ${toX} ${toY}`;

        const isInChain = activeChainNodeIds
          ? activeChainNodeIds.has(conn.from_node_id) && activeChainNodeIds.has(conn.to_node_id)
          : false;
        const isDirectlyConnected = selectedNodeId === conn.from_node_id || selectedNodeId === conn.to_node_id;
        const isActive = isInChain || isDirectlyConnected;

        return (
          <g key={`${conn.from_node_id}-${conn.to_node_id}-${i}`}>
            <path
              d={path}
              fill="none"
              stroke={isActive ? '#e91e63' : '#94a3b8'}
              strokeWidth={isActive ? 2.5 : 2}
              strokeDasharray={isActive ? undefined : '8 6'}
              filter={isActive ? 'url(#conn-glow)' : undefined}
            />
            {isActive && (
              <>
                <circle r={4} fill="#e91e63">
                  <animateMotion dur="2.5s" repeatCount="indefinite" path={path} />
                </circle>
                <circle r={8} fill="#e91e63" opacity={0.3}>
                  <animateMotion dur="2.5s" repeatCount="indefinite" path={path} />
                </circle>
              </>
            )}
            {conn.label && (
              <text
                x={(fromX + toX) / 2}
                y={(fromY + toY) / 2 - 8}
                textAnchor="middle"
                className="text-[10px] fill-gray-400"
              >
                {conn.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
