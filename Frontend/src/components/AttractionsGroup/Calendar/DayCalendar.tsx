interface DayCalendarProps {
  date?: Date;
  dayNumber?: number;
}

function DayCalendar({ date = new Date(), dayNumber }: DayCalendarProps) {
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const formattedDate = date.toLocaleDateString("pl-PL");

  return (
    <div className='border rounded-2xl p-2 h-full w-full'>
      <div>
        <div className=''>
          {dayName} - Day {dayNumber}
        </div>
        <div>{formattedDate}</div>
      </div>
      <div className='flex flex-col gap-4 m-2'>
        <div className='flex-1 border rounded-xl p-2 '>
          <p>Morning</p>
          <ul>
            <li>Event 1</li>
            <li>Event 2</li>
          </ul>
        </div>
        <div className='flex-1 border rounded-xl p-2 '>
          <p>Afternoon</p>
          <ul>
            <li>Event 1</li>
            <li>Event 2</li>
          </ul>
        </div>
        <div className='flex-1 border rounded-xl p-2'>
          <p>Evening</p>
          <ul>
            <li>Event 1</li>
            <li>Event 2</li>
          </ul>
        </div>
        <div className='flex-1 border rounded-xl p-2'>
          <p>Night</p>
          <ul>
            <li>Event 1</li>
            <li>Event 2</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
export default DayCalendar;
