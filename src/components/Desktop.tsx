import { useState } from "react";
import type { ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import type { DragStartEvent } from "@dnd-kit/core";

interface DesktopProps {
  children: ReactNode;
}

export interface DragItem {
  id: string;
  type: "icon" | "window";
}

export function Desktop({ children }: DesktopProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = () => {
    setActiveId(null);
    // The actual position updates are handled by individual components
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="desktop">{children}</div>
      <DragOverlay>
        {activeId ? <div style={{ opacity: 0.5 }}>Dragging...</div> : null}
      </DragOverlay>
    </DndContext>
  );
}
