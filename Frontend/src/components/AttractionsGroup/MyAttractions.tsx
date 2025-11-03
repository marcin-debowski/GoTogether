import Events from "../layout/attractionsLeyout/Events";
import DayCalendar from "./DayCalendar";

function MyAttractions() {
  return (
    <div className='flex h-full overflow-hidden'>
      <div className='w-1/6'>
        <Events />
      </div>

      <div className='flex-1 p-4'>
        My Attractions Component
        <DayCalendar />
      </div>
    </div>
  );
}

export default MyAttractions;
