import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useDroppable } from "@dnd-kit/core";

interface EventSchedule {
  _id: string;
  eventId: {
    _id: string;
    title: string;
    description: string;
    location: string;
    durationHours: number;
  };
  startDateTime: string;
  endDateTime: string;
  userId: {
    _id: string;
    name: string;
  };
}

interface DayCalendarProps {
  date?: Date;
  dayNumber?: number;
  refreshTrigger?: number;
}

function DayCalendar({ date = new Date(), dayNumber, refreshTrigger }: DayCalendarProps) {
  const { slug } = useParams<{ slug: string }>();
  const [events, setEvents] = useState<EventSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const formattedDate = date.toLocaleDateString("pl-PL");

  // Fetch events dla tego dnia
  useEffect(() => {
    const fetchEvents = async () => {
      if (!slug) return;

      try {
        const dateStr = date.toISOString().split("T")[0];
        const res = await axios.get(`/api/groups/${slug}/schedule`, {
          params: { date: dateStr },
          withCredentials: true,
        });
        setEvents(res.data || []);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [date, slug, refreshTrigger]);

  // Auto-scroll to first event or current time
  useEffect(() => {
    if (!timelineRef.current || loading) return;

    // Skip auto-scroll on initial mount to avoid jarring effect
    if (isInitialMount.current) {
      isInitialMount.current = false;

      // Scroll to current time on first load (smooth)
      const now = new Date();
      const currentHour = now.getHours();
      const scrollPosition = Math.max(0, (currentHour - 2) * 60); // 2h before current time

      timelineRef.current.scrollTo({
        top: scrollPosition,
        behavior: "smooth",
      });
      return;
    }

    // On date change, scroll to first event or 8am (smooth)
    if (events.length > 0) {
      const firstEventTime = new Date(events[0].startDateTime);
      const firstEventMinutes = firstEventTime.getHours() * 60 + firstEventTime.getMinutes();
      const scrollPosition = Math.max(0, firstEventMinutes - 60); // 1h before first event

      timelineRef.current.scrollTo({
        top: scrollPosition,
        behavior: "smooth",
      });
    } else {
      // No events - scroll to 8am (smooth)
      timelineRef.current.scrollTo({
        top: 8 * 60,
        behavior: "smooth",
      });
    }
  }, [events, loading]);

  // Oblicz pozycję eventu na timeline (w pikselach od góry)
  const getEventPosition = (startDateTime: string) => {
    const start = new Date(startDateTime);
    const hours = start.getHours();
    const minutes = start.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // 60px na godzinę = 1px na minutę
    return totalMinutes;
  };

  // Oblicz wysokość eventu
  const getEventHeight = (startDateTime: string, endDateTime: string) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = durationMs / (1000 * 60);

    // 60px na godzinę = 1px na minutę
    return Math.max(durationMinutes, 40); // min 40px height
  };

  // Format czasu (HH:MM)
  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Renderuj 24 godziny (00:00 - 23:00)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handleDeleteEvent = async (scheduleId: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await axios.delete(`/api/groups/${slug}/schedule/${scheduleId}`, {
        withCredentials: true,
      });

      // Refresh events
      setEvents((prev) => prev.filter((e) => e._id !== scheduleId));
    } catch (err: any) {
      console.error("Error deleting event:", err);
      alert(err.response?.data?.message || "Failed to delete event");
    }
  };

  return (
    <div className='border rounded-2xl p-2 h-[calc(100%-1rem)] w-full mt-4 flex flex-col'>
      {/* Header */}
      <div className='p-3 border-b'>
        <div className='text-lg font-semibold'>
          {dayName} - Day {dayNumber}
        </div>
        <div className='text-sm text-gray-600'>{formattedDate}</div>
      </div>

      {/* Timeline Container */}
      <div ref={timelineRef} className='flex-1 overflow-y-auto'>
        <div className='flex relative'>
          {/* Time Labels (Left Column) */}
          <div className='w-16 flex-shrink-0 border-r sticky left-0 bg-white z-10'>
            {hours.map((hour) => (
              <div key={hour} className='h-[60px] border-b text-xs text-gray-500 p-1'>
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Events Area */}
          <div className='flex-1 relative' style={{ height: `${24 * 60}px` }}>
            {/* Droppable Time Slots */}
            {hours.map((hour) => (
              <TimeSlot key={hour} hour={hour} date={date} />
            ))}

            {/* Events (Absolute Positioned) */}
            {loading ? (
              <div className='flex items-center justify-center h-full'>
                <p className='text-gray-500'>Loading events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className='flex items-center justify-center h-full'>
                <p className='text-gray-400'>No events scheduled</p>
              </div>
            ) : (
              events.map((event) => {
                const top = getEventPosition(event.startDateTime);
                const height = getEventHeight(event.startDateTime, event.endDateTime);

                return (
                  <div
                    key={event._id}
                    className='absolute left-2 right-2 bg-blue-100 border-l-4 border-blue-500 rounded p-2 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group'
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      minHeight: "40px",
                    }}
                  >
                    <div className='text-sm font-semibold text-blue-900 truncate'>
                      {event.eventId.title}
                    </div>
                    <div className='text-xs text-gray-600 truncate'>
                      📍 {event.eventId.location}
                    </div>
                    <div className='text-xs text-gray-500'>
                      ⏱️ {formatTime(event.startDateTime)} - {formatTime(event.endDateTime)}
                    </div>

                    {/* Delete button (visible on hover) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event._id);
                      }}
                      className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-opacity'
                      title='Delete event'
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// TimeSlot component - droppable zone for each hour
function TimeSlot({ hour, date }: { hour: number; date: Date }) {
  const dateStr = date.toISOString().split("T")[0];
  const timeStr = `${hour.toString().padStart(2, "0")}:00`;
  const slotId = `${dateStr}-${timeStr}-${dateStr}`;

  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
  });

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-0 right-0 h-[60px] border-b transition-colors ${
        isOver ? "bg-blue-100 border-blue-400" : "border-gray-200"
      }`}
      style={{ top: `${hour * 60}px` }}
    />
  );
}

export default DayCalendar;
