import { useRef, useEffect } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import gsap from 'gsap'
import SortableBlock from './SortableBlock'

export default function LandingEditor({
  sections, onReorder, onTogglePublish, onDelete, onEditSettings, onUpdateContent,
}) {
  const listRef = useRef(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sections.findIndex((s) => s.id === active.id)
    const newIndex = sections.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(sections, oldIndex, newIndex).map((s, i) => ({ ...s, order_index: i }))
    onReorder(reordered)

    // GSAP camera-style position animation on the list
    if (listRef.current) {
      gsap.fromTo(listRef.current.children, { opacity: 0.6, y: -10 }, {
        opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out',
      })
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div ref={listRef} className="space-y-1">
          {sections.map((section) => (
            <SortableBlock
              key={section.id}
              section={section}
              onEditSettings={onEditSettings}
              onTogglePublish={onTogglePublish}
              onDelete={onDelete}
              onUpdateContent={onUpdateContent}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
