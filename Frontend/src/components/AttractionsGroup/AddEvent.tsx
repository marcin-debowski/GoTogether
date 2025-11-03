interface AddEventProps {
  onClose: () => void;
}

function AddEvent({ onClose }: AddEventProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Add logic to save event
    onClose();
  };

  return (
    <div className='fixed inset-0 flex items-center justify-center z-50'>
      <div className='absolute inset-0 bg-black/40' onClick={onClose} />
      <div className='relative bg-white p-6 rounded-lg shadow-md max-w-md w-full'>
        <button
          onClick={onClose}
          className='absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl'
          aria-label='Close'
        >
          ×
        </button>

        <form onSubmit={handleSubmit}>
          <h2 className='text-xl font-bold mb-4'>Add Event Form</h2>
          <label className='block mb-2'>
            Event Name:
            <input type='text' name='eventName' className='border p-2 rounded w-full' required />
          </label>
          <br />
          <label className='block mb-2'>
            Duration:
            <input type='number' name='eventDuration' className='border p-2 rounded w-full' />
          </label>
          <br />
          <label className='block mb-2'>
            Description:
            <textarea name='eventDescription' className='border p-2 rounded w-full'></textarea>
          </label>
          <br />
          <div className='flex gap-2'>
            <button type='submit' className='bg-blue-500 text-white rounded px-4 py-2 flex-1'>
              Add Event
            </button>
            <button
              type='button'
              onClick={onClose}
              className='bg-gray-300 text-gray-700 rounded px-4 py-2'
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default AddEvent;
