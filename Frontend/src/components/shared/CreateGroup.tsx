import { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";

type CreatedGroup = { _id: string; name: string; slug: string };
type Props = {
  onClose: () => void;
  onCreated?: (group: CreatedGroup) => void;
};

function CreateGroup({ onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    place: "",
    startDate: new Date().toISOString().split("T")[0], // dzisiejsza data w formacie YYYY-MM-DD
    endDate: new Date().toISOString().split("T")[0], // dzisiejsza data w formacie YYYY-MM-DD
  });

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const name = form.name.trim() || "";
      const place = form.place.trim() || "";
      const startDate = form.startDate || "";
      const endDate = form.endDate || "";

      // Convert date-only (YYYY-MM-DD) to explicit UTC ISO to avoid timezone shifts
      const isoStartDate = startDate ? `${startDate}T00:00:00.000Z` : undefined;
      const isoEndDate = endDate ? `${endDate}T00:00:00.000Z` : undefined;

      if (!name) {
        setError("Nazwa grupy jest wymagana.");
        setLoading(false);
        return;
      }

      const payload: Record<string, unknown> = { name, place };
      if (isoStartDate) payload.startDate = isoStartDate;
      if (isoEndDate) payload.endDate = isoEndDate;

      const res = await axios.post("/api/groups/create", payload, { withCredentials: true });
      const created = (res.data?.group ?? res.data) as CreatedGroup;
      onCreated?.(created);
      onClose();
      //dodac odswiezenie listy grup i zaladowanie nowej grupy
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Nie udało się utworzyć grupy.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className='fixed inset-0 z-[1000] flex items-center justify-center'
      role='dialog'
      aria-modal='true'
    >
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/40' onClick={onClose} />

      {/* Modal content */}
      <div
        className='relative w-full max-w-xl p-6 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-2xl flex flex-col gap-4'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between'>
          <label className='text-xl font-semibold'>Create Group</label>
          <button
            onClick={onClose}
            aria-label='Close create group'
            className='text-gray-600 hover:text-gray-900'
          >
            ✕
          </button>
        </div>

        {error && (
          <p className='text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded'>
            {error}
          </p>
        )}

        <form onSubmit={onSubmitHandler} className='flex flex-col gap-4'>
          <label className='text-sm font-medium' htmlFor='name'>
            Group Name
          </label>
          <input
            value={form.name}
            onChange={onChangeHandler}
            id='name'
            name='name'
            type='text'
            placeholder='Group Name'
            className='p-2 w-full border border-gray-300 rounded'
            required
          />

          <label className='text-sm font-medium' htmlFor='place'>
            Place
          </label>
          <input
            value={form.place}
            onChange={onChangeHandler}
            id='place'
            name='place'
            type='text'
            placeholder='Place'
            className='p-2 w-full border border-gray-300 rounded'
          />

          <label className='text-sm font-medium' htmlFor='startDate'>
            Start Date
          </label>
          <input
            value={form.startDate}
            onChange={onChangeHandler}
            id='startDate'
            name='startDate'
            type='date'
            className='p-2 w-full border border-gray-300 rounded'
          />

          <label className='text-sm font-medium' htmlFor='endDate'>
            End Date
          </label>
          <input
            value={form.endDate}
            onChange={onChangeHandler}
            id='endDate'
            name='endDate'
            type='date'
            className='p-2 w-full border border-gray-300 rounded'
          />

          <div className='flex gap-2 mt-4 justify-end'>
            <button
              type='submit'
              disabled={loading}
              className='p-2 bg-blue-600 disabled:opacity-60 text-white rounded hover:bg-blue-700'
            >
              {loading ? "Creating..." : "Create"}
            </button>
            <button
              type='button'
              onClick={onClose}
              className='p-2 bg-gray-200 rounded hover:bg-gray-300'
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default CreateGroup;
