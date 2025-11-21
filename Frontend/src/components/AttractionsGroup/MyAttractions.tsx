import { useState } from "react";
import Events from "../layout/attractionsLeyout/Events";
import DayCalendar from "./Calendar/DayCalendar";
import { useGroup } from "../../context/GroupContext";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import axios from "axios";
import { useParams } from "react-router-dom";

interface Event {
  _id: string;
  title: string;
  description: string;
  durationHours: number;
  location: string;
}

function MyAttractions() {
  const [currentOffset, setCurrentOffset] = useState(0);
  const { currentGroup } = useGroup();
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { slug } = useParams<{ slug: string }>();
  // Use an activation delay so a short click doesn't immediately start dragging.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const getDisplayedDateRange = () => {
    if (!currentGroup?.startDate) {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 2);
      return { start: today, end: endDate };
    }

    const startDate = new Date(currentGroup.startDate);
    startDate.setDate(startDate.getDate() + currentOffset);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 2);

    return { start: startDate, end: endDate };
  };

  const getDisplayedDays = () => {
    const days = [];
    for (let i = 0; i < 3; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);

      // Calculate day number of trip
      let dayNumber = i + 1;
      if (currentGroup?.startDate) {
        const tripStart = new Date(currentGroup.startDate);
        const diffTime = day.getTime() - tripStart.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        dayNumber = diffDays + 1;
      }

      days.push({ date: day, dayNumber });
    }
    return days;
  };

  const { start, end } = getDisplayedDateRange();
  const displayedDays = getDisplayedDays();

  const canGoToPrevious = () => {
    if (!currentGroup?.startDate) return true;
    const tripStart = new Date(currentGroup.startDate);
    return start > tripStart;
  };

  const canGoToNext = () => {
    if (!currentGroup?.endDate) return true;
    const tripEnd = new Date(currentGroup.endDate);
    return end < tripEnd;
  };

  const goToPrevious = () => {
    if (canGoToPrevious()) {
      setCurrentOffset((prev) => prev - 1);
    }
  };

  const goToNext = () => {
    if (canGoToNext()) {
      setCurrentOffset((prev) => prev + 1);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const eventData = event.active.data.current as Event;
    setActiveEvent(eventData);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveEvent(null);
      return;
    }

    try {
      // over.id format: "2025-11-12-14:00-2025-11-12"
      const dropId = over.id as string;
      const parts = dropId.split("-");

      // Extract date and time
      const dateStr = `${parts[0]}-${parts[1]}-${parts[2]}`; // "2025-11-12"
      const timeStr = parts[3]; // "14:00"

      // Build startDateTime
      const [hours, minutes] = timeStr.split(":");
      const startDateTime = new Date(dateStr);
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const eventId = active.id as string;

      // Create EventSchedule
      await axios.post(
        `/api/groups/${slug}/schedule`,
        {
          eventId,
          startDateTime: startDateTime.toISOString(),
        },
        { withCredentials: true }
      );

      // Refresh calendar
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      console.error("Error scheduling event:", err);
      alert(err.response?.data?.message || "Failed to add event to schedule");
    } finally {
      setActiveEvent(null);
    }
  };

  const handleDragCancel = () => {
    setActiveEvent(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      collisionDetection={pointerWithin}
    >
      <div className='flex h-full overflow-hidden'>
        <div className='w-1/6'>
          <Events />
        </div>
        <div className='flex-1 h-full w-full m-4'>
          <div className='flex items-center justify-between h-1/12 w-full bg-white border-2 border-gray-300 p-4 rounded-xl shadow-md'>
            {/* Left arrow */}
            <button
              onClick={goToPrevious}
              disabled={!canGoToPrevious()}
              className={`p-3 rounded-lg transition-all font-bold text-lg ${
                canGoToPrevious()
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:shadow-md cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
              }`}
              title={canGoToPrevious() ? "Previous period" : "Start of trip"}
            >
              ◀
            </button>

            {/* Date range display */}
            <p className='text-gray-800 font-bold text-lg tracking-wide'>
              {start.toLocaleDateString()} - {end.toLocaleDateString()}
            </p>

            {/* Right arrow */}
            <button
              onClick={goToNext}
              disabled={!canGoToNext()}
              className={`p-3 rounded-lg transition-all font-bold text-lg ${
                canGoToNext()
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:shadow-md cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
              }`}
              title={canGoToNext() ? "Next period" : "End of trip"}
            >
              ▶
            </button>
          </div>
          <div className=' pb-4 flex h-11/12 gap-4 w-full'>
            {displayedDays.map((day, index) => (
              <DayCalendar
                key={index}
                date={day.date}
                dayNumber={day.dayNumber}
                refreshTrigger={refreshTrigger}
              />
            ))}
          </div>
        </div>
      </div>

      {/* DragOverlay - shows dragged element */}
      <DragOverlay>
        {activeEvent ? (
          <div className='bg-blue-500 text-white p-4 rounded-lg shadow-xl opacity-90'>
            <div className='font-bold text-lg'>{activeEvent.title}</div>
            <div className='text-sm'>⏱️ {activeEvent.durationHours}h</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default MyAttractions;
