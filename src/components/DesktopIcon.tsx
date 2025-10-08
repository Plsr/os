import { useDraggable } from "@dnd-kit/core";

export interface DesktopIconProps {
  id: string;
  icon: string;
  label: string;
  onDoubleClick?: () => void;
}

export function DesktopIcon({
  id,
  icon,
  label,
  onDoubleClick,
}: DesktopIconProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`desktop-icon ${isDragging ? "dragging" : ""}`}
      onDoubleClick={onDoubleClick}
    >
      <div className="icon-image">{icon}</div>
      <div className="icon-label">{label}</div>
    </div>
  );
}

