import { useDroppable } from '@dnd-kit/core';

export default function Droppable({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={className}
      style={{
        outline: isOver ? '2px dashed #60a5fa' : undefined,
        borderRadius: 8,
      }}
    >
      {children}
    </div>
  );
}
