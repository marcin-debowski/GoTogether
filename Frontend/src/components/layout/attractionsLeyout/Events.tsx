import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import AddEvent from "../../AttractionsGroup/AddEvent";
import EditEvent from "../../AttractionsGroup/EditEvent";

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
            <div
              key={event._id}
              onClick={() => handleEditEvent(event)}
              className='border p-4 rounded shadow-md bg-white cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all'
            >
              <h3 className='font-bold text-lg mb-2'>{event.title}</h3>
              <p className='text-gray-600 mb-1'>
                📍 <span className='font-medium'>Location:</span> {event.location}
              </p>
              <p className='text-gray-600 mb-1'>
                ⏱️ <span className='font-medium'>Duration:</span> {event.durationHours} hours
              </p>
              <p className='text-gray-600 mb-2'>
                👤 <span className='font-medium'>Created by:</span> {event.createdBy.name}
              </p>
              <p className='text-gray-700 text-sm'>{event.description}</p>
              <p className='text-xs text-gray-400 mt-2'>
                Added: {new Date(event.createdAt).toLocaleDateString()}
              </p>
            </div>
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
export default Events;
