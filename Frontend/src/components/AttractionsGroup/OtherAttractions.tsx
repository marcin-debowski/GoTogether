import { useState } from "react";
import { useGroup } from "../../context/GroupContext";
import DayCalendar from "./Calendar/DayCalendar";
import ChooseMember from "../layout/attractionsLeyout/ChooseMember";

function OtherAttractions() {
  const [currentOffset, setCurrentOffset] = useState(0);
  const { currentGroup } = useGroup();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

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
        <ChooseMember onMemberSelect={setSelectedMemberId} selectedMemberId={selectedMemberId} />
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
              userId={selectedMemberId}
              isReadOnly={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default OtherAttractions;
