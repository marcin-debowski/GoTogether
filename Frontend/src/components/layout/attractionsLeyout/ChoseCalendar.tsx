import { NavLink, Outlet } from "react-router-dom";

function ChoseCalendar() {
  return (
    <div className='flex flex-col h-full'>
      <div className='flex gap-2'>
        <NavLink
          to='mycalendar'
          className={({ isActive }) =>
            `flex-1 p-4 rounded-lg text-base font-medium
        transition-all duration-200 ease-in-out ${
          isActive
            ? "bg-blue-500 text-white"
            : "text-gray-700 bg-gray-100 hover:text-blue-600 hover:shadow-md "
        }`
          }
        >
          My Calendar
        </NavLink>
        <NavLink
          to='othercalendar'
          className={({ isActive }) =>
            `flex-1 p-4 rounded-lg text-base font-medium
        transition-all duration-200 ease-in-out ${
          isActive
            ? "bg-blue-500 text-white"
            : "text-gray-700 bg-gray-100 hover:text-blue-600 hover:shadow-md "
        }`
          }
        >
          Other Calendars
        </NavLink>
      </div>
      {/* Here you can add a date picker or calendar component */}
      <div className='flex-1 overflow-hidden'>
        <Outlet />
      </div>
    </div>
  );
}
export default ChoseCalendar;
