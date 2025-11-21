import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import AddEvent from "../../AttractionsGroup/AddEvent";
import EditEvent from "../../AttractionsGroup/EditEvent";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface Event {
  _id: string;
  title: string;
  description: string;
  durationHours: number;
  location: string;
  groupId: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

function Events() {
  const { slug } = useParams<{ slug: string }>();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`/api/events/${slug}/events`, {
          withCredentials: true,
        });
        setEvents(response.data);
      } catch (err: any) {
        console.error("Error fetching events:", err);
        setError(err.response?.data?.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchEvents();
    }
  }, [slug, refreshTrigger]);

  const handleAddEvent = () => {
    setShowAddEvent(true);
  };

  const handleCloseAddEvent = () => {
    setShowAddEvent(false);
  };

  const handleEventAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
  };

  const handleCloseEditEvent = () => {
    setEditingEvent(null);
  };

  const handleEventUpdated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const toggleExpanded = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  return (
    <div className='flex flex-col rounded-tr-lg h-[calc(100%-1rem)] border-r border-t mt-4 '>
      <div className='flex items-center'>
        <h1 className='text-2xl font-bold mb-4 p-4 pb-0'>Events</h1>
        <div>
          <button
            className=' mb-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 mr-4'
            onClick={handleAddEvent}
          >
            + Add
          </button>
        </div>
      </div>
      <div className='flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4'>
        {loading ? (
          <div className='text-center py-8 text-gray-500'>Loading events...</div>
        ) : error ? (
          <div className='text-center py-8 text-red-500'>{error}</div>
        ) : events.length === 0 ? (
          <div className='text-center py-8 text-gray-400'>
            No events yet. Click "+ Add" to create one!
          </div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              isExpanded={expandedEvents.has(event._id)}
              onToggleExpand={toggleExpanded}
              onEdit={handleEditEvent}
            />
          ))
        )}
      </div>

      {showAddEvent && <AddEvent onClose={handleCloseAddEvent} onEventAdded={handleEventAdded} />}
      {editingEvent && (
        <EditEvent
          event={editingEvent}
          onClose={handleCloseEditEvent}
          onEventUpdated={handleEventUpdated}
        />
      )}
    </div>
  );
}

// EventCard component - draggable event
function EventCard({
  event,
  isExpanded,
  onToggleExpand,
  onEdit,
}: {
  event: Event;
  isExpanded: boolean;
  onToggleExpand: (eventId: string, e: React.MouseEvent) => void;
  onEdit: (event: Event) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event._id,
    data: event,
  });

  const transformStyle = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const style = {
    ...transformStyle,
    opacity: isDragging ? 0.5 : 1,
  } as any;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border p-4 rounded shadow-md bg-white hover:shadow-lg hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? "ring-2 ring-blue-500 opacity-50" : ""
      }`}
      {...listeners}
      {...attributes}
    >
      {/* Collapsed View - Always Visible */}
      <div className='flex items-center justify-between'>
        <div
          className='flex-1 cursor-pointer'
          onClick={(e) => {
            e.stopPropagation();
            onEdit(event);
          }}
        >
          <h3 className='font-bold text-lg'>{event.title}</h3>
          <p className='text-gray-600 text-sm'>⏱️ {event.durationHours} hours</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(event._id, e);
          }}
          className='ml-2 p-2 hover:bg-gray-100 rounded transition-colors'
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
          </svg>
        </button>
      </div>

      {/* Expanded View - Conditional */}
      {isExpanded && (
        <div
          className='mt-3 pt-3 border-t cursor-pointer'
          onClick={(e) => {
            e.stopPropagation();
            onEdit(event);
          }}
        >
          <p className='text-gray-600 mb-1'>
            📍 <span className='font-medium'>Location:</span> {event.location}
          </p>
          <p className='text-gray-600 mb-2'>
            👤 <span className='font-medium'>Created by:</span> {event.createdBy.name}
          </p>
          <p className='text-gray-700 text-sm mb-2'>{event.description}</p>
          <p className='text-xs text-gray-400'>
            Added: {new Date(event.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default Events;
