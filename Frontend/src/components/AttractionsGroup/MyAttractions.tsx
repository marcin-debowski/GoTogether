import { useState } from "react";
import Events from "../layout/attractionsLeyout/Events";
import DayCalendar from "./Calendar/DayCalendar";
import { useGroup } from "../../context/GroupContext";

function MyAttractions() {
  const [currentOffset, setCurrentOffset] = useState(0);
  const { currentGroup } = useGroup();

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

  return (
    <div className='flex h-full overflow-hidden'>
      <div className='w-1/6'>
        <Events />
      </div>
      <div className='flex-1 h-full w-full m-4'>
        <div className='flex items-center justify-between h-1/12 w-full bg-blue-200 p-2 rounded-xl'>
          {/* Left arrow */}
          <button
            onClick={goToPrevious}
            disabled={!canGoToPrevious()}
            className={`p-2 rounded-lg shadow-sm transition-all font-bold ${
              canGoToPrevious()
                ? "bg-white hover:bg-gray-100 text-blue-600 cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            title={canGoToPrevious() ? "Previous period" : "Start of trip"}
          >
            ◀
          </button>

          {/* Date range display */}
          <p className='text-white font-semibold'>
            {start.toLocaleDateString()} - {end.toLocaleDateString()}
          </p>

          {/* Right arrow */}
          <button
            onClick={goToNext}
            disabled={!canGoToNext()}
            className={`p-2 rounded-lg shadow-sm transition-all font-bold ${
              canGoToNext()
                ? "bg-white hover:bg-gray-100 text-blue-600 cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            title={canGoToNext() ? "Next period" : "End of trip"}
          >
            ▶
          </button>
        </div>
        <div className=' pb-4 flex h-11/12 gap-4 w-full'>
          {displayedDays.map((day, index) => (
            <DayCalendar key={index} date={day.date} dayNumber={day.dayNumber} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyAttractions;
