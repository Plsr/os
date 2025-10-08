import { useState } from "react";
import type { ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";

interface WindowData {
  id: string;
  title: string;
  content: string;
  position: { x: number; y: number };
  zIndex: number;
}

interface DesktopProps {
  children: ReactNode;
  windows: WindowData[];
  onWindowDragEnd: (windowId: string, delta: { x: number; y: number }) => void;
}

export interface DragItem {
  id: string;
  type: "icon" | "window";
}

export function Desktop({ children, windows, onWindowDragEnd }: DesktopProps) {
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;

    if (delta.x !== 0 || delta.y !== 0) {
      onWindowDragEnd(active.id as string, delta);
    }

    setActiveId(null);
  };

  const activeWindow = windows.find((w) => w.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="desktop">{children}</div>
      <DragOverlay dropAnimation={null}>
        {activeId && activeWindow ? (
          <div
            className="window dragging-overlay"
            style={{
              width: 500,
              height: 350,
              opacity: 0.8,
              pointerEvents: "none",
            }}
          >
            <div className="window-titlebar">
              <div className="window-title">{activeWindow.title}</div>
              <div className="window-controls">
                <button className="window-control-btn close" />
                <button className="window-control-btn minimize" />
                <button className="window-control-btn maximize" />
              </div>
            </div>
            <div className="window-content">
              <p>{activeWindow.content}</p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
