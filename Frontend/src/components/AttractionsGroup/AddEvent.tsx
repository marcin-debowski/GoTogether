import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

interface AddEventProps {
  onClose: () => void;
  onEventAdded?: () => void;
}

function AddEvent({ onClose, onEventAdded }: AddEventProps) {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields state
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [description, setDescription] = useState("");

  // Toast notifications
  type ToastType = "success" | "error" | "info";
  type Toast = { id: number; type: ToastType; message: string; leaving?: boolean };
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = ++toastIdRef.current;
    const displayMs = 5000;
    const fadeMs = 1000;
    setToasts((prev) => [...prev, { id, type, message }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    }, Math.max(0, displayMs - fadeMs));

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, displayMs);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Walidacja
      if (!title.trim()) {
        setError("Event name is required");
        showToast("Event name is required", "error");
        setLoading(false);
        return;
      }

      if (!location.trim()) {
        setError("Location is required");
        showToast("Location is required", "error");
        setLoading(false);
        return;
      }

      if (!description.trim()) {
        setError("Description is required");
        showToast("Description is required", "error");
        setLoading(false);
        return;
      }

      const duration = parseFloat(durationHours);
      if (isNaN(duration) || duration <= 0) {
        setError("Duration must be a positive number");
        showToast("Duration must be a positive number", "error");
        setLoading(false);
        return;
      }

      const payload = {
        title: title.trim(),
        location: location.trim(),
        durationHours: duration,
        description: description.trim(),
      };

      console.log("Sending event payload:", payload);

      await axios.post(`/api/events/${slug}/events`, payload, {
        withCredentials: true,
      });

      showToast("Event added successfully!", "success");

      // Reset form
      setTitle("");
      setLocation("");
      setDurationHours("");
      setDescription("");

      // Odśwież listę eventów
      if (onEventAdded) {
        onEventAdded();
      }

      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to add event";
      setError(errorMsg);
      showToast(errorMsg, "error");
      console.error("Error adding event:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 flex items-center justify-center z-50'>
      {/* Toast notifications */}
      <div className='fixed top-4 right-4 z-[60] space-y-2'>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              px-4 py-3 rounded shadow-lg text-white font-medium
              transition-all duration-1000
              ${toast.leaving ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0"}
              ${
                toast.type === "success"
                  ? "bg-green-500"
                  : toast.type === "error"
                  ? "bg-red-500"
                  : "bg-blue-500"
              }
            `}
          >
            {toast.message}
          </div>
        ))}
      </div>

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
          <h2 className='text-xl font-bold mb-4'>Add Event</h2>

          {error && <div className='mb-4 p-2 bg-red-100 text-red-700 rounded'>{error}</div>}

          <label className='block mb-2'>
            Event Name:<span className='text-red-500'>*</span>
            <input
              type='text'
              name='eventName'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className='border p-2 rounded w-full'
              required
              disabled={loading}
            />
          </label>

          <label className='block mb-2'>
            Location:<span className='text-red-500'>*</span>
            <input
              type='text'
              name='eventLocation'
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className='border p-2 rounded w-full'
              required
              disabled={loading}
            />
          </label>

          <label className='block mb-2'>
            Duration (hours):<span className='text-red-500'>*</span>
            <input
              type='number'
              name='eventDuration'
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              step='0.1'
              min='0.1'
              className='border p-2 rounded w-full'
              required
              disabled={loading}
            />
          </label>

          <label className='block mb-2'>
            Description:<span className='text-red-500'>*</span>
            <textarea
              name='eventDescription'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='border p-2 rounded w-full'
              rows={3}
              required
              disabled={loading}
            ></textarea>
          </label>

          <div className='flex gap-2 mt-4'>
            <button
              type='submit'
              className='bg-blue-500 text-white rounded px-4 py-2 flex-1 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed'
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Event"}
            </button>
            <button
              type='button'
              onClick={onClose}
              className='bg-gray-300 text-gray-700 rounded px-4 py-2 hover:bg-gray-400'
              disabled={loading}
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
