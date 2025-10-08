import { useState } from "react";
import type { ReactNode, CSSProperties } from "react";
import { useDraggable } from "@dnd-kit/core";

export interface WindowProps {
  id: string;
  title: string;
  children: ReactNode;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  onClose?: () => void;
  zIndex?: number;
  onFocus?: () => void;
}

export function Window({
  id,
  title,
  children,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 400, height: 300 },
  onClose,
  zIndex = 1,
  onFocus,
}: WindowProps) {
  const [position, setPosition] = useState(initialPosition);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
    });

  const style: CSSProperties = {
    left: position.x,
    top: position.y,
    width: initialSize.width,
    height: initialSize.height,
    zIndex: isDragging ? 1000 : zIndex,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  };

  const handleDragEnd = () => {
    if (transform) {
      setPosition({
        x: position.x + transform.x,
        y: position.y + transform.y,
      });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`window ${isDragging ? "dragging" : ""}`}
      onClick={onFocus}
      onMouseUp={handleDragEnd}
    >
      <div className="window-titlebar" {...listeners} {...attributes}>
        <div className="window-title">{title}</div>
        <div className="window-controls">
          <button className="window-control-btn close" onClick={onClose} />
          <button className="window-control-btn minimize" onClick={() => {}} />
          <button className="window-control-btn maximize" onClick={() => {}} />
        </div>
      </div>
      <div className="window-content">{children}</div>
    </div>
  );
}
