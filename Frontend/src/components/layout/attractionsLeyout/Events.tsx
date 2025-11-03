import { useState } from "react";
import AddEvent from "../../AttractionsGroup/AddEvent";

function Events() {
  const [showAddEvent, setShowAddEvent] = useState(false);

  const handleAddEvent = () => {
    setShowAddEvent(true);
  };

  const handleCloseAddEvent = () => {
    setShowAddEvent(false);
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
        <div className='border p-4 rounded shadow-md bg-white'>
          <p>Event Name</p>
          <p>Event Date</p>
          <p>Event Description</p>
        </div>
        <div className='border p-4 rounded shadow-md'>
          <p>Event Name</p>
          <p>Event Date</p>
          <p>Event Description</p>
        </div>
        <div className='border p-4 rounded shadow-md'>
          <p>Event Name</p>
          <p>Event Date</p>
          <p>Event Description</p>
        </div>
        <div className='border p-4 rounded shadow-md'>
          <p>Event Name</p>
          <p>Event Date</p>
          <p>Event Description</p>
        </div>
        <div className='border p-4 rounded shadow-md'>
          <p>Event Name</p>
          <p>Event Date</p>
          <p>Event Description</p>
        </div>
        <div className='border p-4 rounded shadow-md'>
          <p>Event Name</p>
          <p>Event Date</p>
          <p>Event Description</p>
        </div>
        <div className='border p-4 rounded shadow-md'>
          <p>Event Name</p>
          <p>Event Date</p>
          <p>Event Description</p>
        </div>
      </div>

      {showAddEvent && <AddEvent onClose={handleCloseAddEvent} />}
    </div>
  );
}
export default Events;
