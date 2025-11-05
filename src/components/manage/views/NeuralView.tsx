import React, { useState, useEffect, useRef } from 'react';
import { AyraItem } from '../ayra-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedTransition } from '@/components/AnimatedTransition';

interface NeuralViewProps {
  items: AyraItem[];
  selectedItems: string[];
  onSelectItem: (id: string) => void;
}

interface NodePosition {
  x: number;
  y: number;
}

interface NeuralNode extends AyraItem {
  position?: NodePosition;
  connections: string[];
}

const NeuralView = ({ items, selectedItems, onSelectItem }: NeuralViewProps) => {
  const [nodes, setNodes] = useState<NeuralNode[]>([]);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [showConnections, setShowConnections] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Convert items to nodes with connections based on shared keywords/space
    const neuralNodes = items.map(item => {
      const connections = items
        .filter(other => other.id !== item.id)
        .filter(other => 
          other.space === item.space || 
          item.keywords.some(k => other.keywords.includes(k))
        )
        .map(other => other.id);

      return {
        ...item,
        connections,
        position: undefined
      };
    });

    setNodes(neuralNodes);
  }, [items]);

  useEffect(() => {
    // Assign random positions to nodes
    if (containerRef.current && nodes.length > 0) {
      const container = containerRef.current.getBoundingClientRect();
      const padding = 100;
      
      const positionedNodes = nodes.map(node => ({
        ...node,
        position: {
          x: padding + Math.random() * (container.width - padding * 2),
          y: padding + Math.random() * (container.height - padding * 2)
        }
      }));

      setNodes(positionedNodes);
    }
  }, [items.length]);

  useEffect(() => {
    setShowConnections(!!activeNode);
  }, [activeNode]);

  const handleNodeClick = (id: string) => {
    setActiveNode(activeNode === id ? null : id);
    onSelectItem(id);
  };

  const getActiveNodeConnections = () => {
    if (!activeNode) return [];
    
    const node = nodes.find(n => n.id === activeNode);
    if (!node || !node.position) return [];

    return node.connections
      .map(connId => nodes.find(n => n.id === connId))
      .filter(conn => conn && conn.position)
      .map(conn => ({
        from: node.position!,
        to: conn!.position!,
        targetId: conn!.id
      }));
  };

  const getNodeColor = (type: string) => {
    const colors = {
      'Note': 'hsl(var(--primary))',
      'PDF': 'hsl(var(--destructive))',
      'Link': 'hsl(var(--accent))',
      'Image': 'hsl(var(--secondary))'
    };
    return colors[type as keyof typeof colors] || 'hsl(var(--muted))';
  };

  const activeNodeData = activeNode ? nodes.find(n => n.id === activeNode) : null;

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[600px] bg-background/50 overflow-hidden">
      {/* Neural Connections */}
      <AnimatedTransition show={showConnections} animation="fade" duration={300}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {getActiveNodeConnections().map((conn, idx) => (
            <line
              key={idx}
              x1={conn.from.x}
              y1={conn.from.y}
              x2={conn.to.x}
              y2={conn.to.y}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeOpacity="0.3"
              className="animate-pulse"
            />
          ))}
        </svg>
      </AnimatedTransition>

      {/* Neural Nodes */}
      {nodes.map((node, idx) => {
        if (!node.position) return null;

        const isActive = activeNode === node.id;
        const isConnected = activeNode && node.connections.includes(activeNode);
        const isSelected = selectedItems.includes(node.id);

        return (
          <div
            key={node.id}
            className={`absolute cursor-pointer transition-all duration-300 ${
              isActive ? 'scale-125 z-20' : isConnected ? 'scale-110 z-10' : 'scale-100'
            }`}
            style={{
              left: node.position.x,
              top: node.position.y,
              transform: 'translate(-50%, -50%)',
              animation: `float ${3 + idx * 0.2}s ease-in-out infinite`
            }}
            onClick={() => handleNodeClick(node.id)}
          >
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
                isSelected ? 'ring-4 ring-primary' : ''
              }`}
              style={{
                background: `radial-gradient(circle at 30% 30%, ${getNodeColor(node.type)}dd, ${getNodeColor(node.type)}88)`,
                boxShadow: isActive
                  ? `0 0 30px ${getNodeColor(node.type)}88`
                  : `0 4px 12px ${getNodeColor(node.type)}44`
              }}
            >
              <span className="text-white text-xs font-bold text-center px-2">
                {node.type}
              </span>
            </div>

            <AnimatedTransition show={isActive || isConnected} animation="fade" duration={200}>
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <Card className="px-3 py-1 bg-background/95 backdrop-blur">
                  <p className="text-xs font-medium">{node.title}</p>
                </Card>
              </div>
            </AnimatedTransition>
          </div>
        );
      })}

      {/* Active Node Details */}
      <AnimatedTransition show={!!activeNodeData} animation="slide-up" duration={300}>
        {activeNodeData && (
          <div className="absolute bottom-4 left-4 right-4 z-30">
            <Card className="p-6 bg-background/95 backdrop-blur">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{activeNodeData.title}</h3>
                  <p className="text-sm text-muted-foreground">{activeNodeData.source}</p>
                </div>
                <Badge variant="outline">{activeNodeData.type}</Badge>
              </div>

              <div className="flex gap-2 flex-wrap mb-3">
                {activeNodeData.keywords.map(keyword => (
                  <Badge key={keyword} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">
                <p><strong>Space:</strong> {activeNodeData.space}</p>
                <p><strong>Connections:</strong> {activeNodeData.connections.length} related items</p>
                <p><strong>Created:</strong> {new Date(activeNodeData.createdDate).toLocaleDateString()}</p>
              </div>
            </Card>
          </div>
        )}
      </AnimatedTransition>
    </div>
  );
};

export default NeuralView;
