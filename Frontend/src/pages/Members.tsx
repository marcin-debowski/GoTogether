import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import deleteIcon from "../assets/delete.png";
import settingsIcon from "../assets/settings.png";

type Member = { _id: string; name: string; email?: string; role?: string; isOwner?: boolean };

function Members() {
  const { slug } = useParams<{ slug: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [nextCursor, setNextCursor] = useState<string | { name: string; id: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
  const [totalCount, setTotalCount] = useState<number | null>(null);

  type ToastType = "success" | "error" | "info";
  type Toast = { id: number; type: ToastType; message: string };
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    const fetchMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/groups/${slug}/members?limit=20`, {
          withCredentials: true,
          signal: controller.signal,
        });
        setMembers(res.data?.members ?? []);
        setNextCursor(res.data?.nextCursor ?? null);
        setTotalCount(
          typeof res.data?.totalCount === "number" ? (res.data.totalCount as number) : null
        );
      } catch (e: any) {
        if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
        const msg = e?.response?.data?.message || e.message || "Failed to load members";
        setError(msg);
        showToast(msg, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
    return () => controller.abort();
  }, [slug]);

  const loadMore = async () => {
    if (!slug || !nextCursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", "20");
      if (typeof nextCursor === "string") {
        params.set("after", nextCursor);
      } else {
        params.set("sort", "name");
        params.set("afterName", nextCursor.name);
        params.set("afterId", nextCursor.id);
      }
      const res = await axios.get(`/api/groups/${slug}/members?${params.toString()}`, {
        withCredentials: true,
      });
      setMembers((prev) => [...prev, ...(res.data?.members ?? [])]);
      setNextCursor(res.data?.nextCursor ?? null);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message || "Failed to load more members";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveClick = async (memberId: string, memberName?: string) => {
    if (!slug) return;
    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć ${memberName ?? "tego użytkownika"} z grupy?`
    );
    if (!confirmed) return;

    setDeletingIds((prev) => ({ ...prev, [memberId]: true }));
    setError(null);
    try {
      await axios.delete(`/api/groups/${slug}/members/${memberId}`, { withCredentials: true });
      setMembers((prev) => prev.filter((m) => m._id !== memberId));
      setTotalCount((c) => (typeof c === "number" ? Math.max(0, c - 1) : c));
      showToast("Usunięto członka z grupy", "success");
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        status === 404
          ? "Nie znaleziono użytkownika lub członkostwa"
          : status === 403
          ? "Tylko administrator grupy może usuwać członków"
          : e?.response?.data?.message || e.message || "Failed to remove member";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setDeletingIds((prev) => {
        const copy = { ...prev };
        delete copy[memberId];
        return copy;
      });
    }
  };

  const handleSettingsClick = (memberId: string, memberName?: string) => {
    alert(`Ustawienia członka ${memberName ?? memberId} nie są jeszcze zaimplementowane.`);
  };

  const handleOnSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!slug) return;

    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      setError("Podaj poprawny adres e-mail");
      return;
    }

    setAddLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `/api/groups/${slug}/members`,
        { email },
        { withCredentials: true }
      );

      const created = res.data?.member ?? res.data;
      if (created && created._id) {
        setMembers((prev) => {
          if (prev.some((m) => m._id === created._id)) return prev;
          return [...prev, created];
        });
        setTotalCount((c) => (typeof c === "number" ? c + 1 : c));
      } else {
        const ref = await axios.get(`/api/groups/${slug}/members?limit=20`, {
          withCredentials: true,
        });
        setMembers(ref.data?.members ?? []);
        setNextCursor(ref.data?.nextCursor ?? null);
        setTotalCount(
          typeof ref.data?.totalCount === "number" ? (ref.data.totalCount as number) : null
        );
      }
      setEmailInput("");
      showToast("Dodano członka do grupy", "success");
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        status === 409
          ? "Użytkownik jest już członkiem grupy"
          : status === 404
          ? "Nie znaleziono użytkownika lub grupy"
          : status === 403
          ? "Brak uprawnień do dodawania członków"
          : e?.response?.data?.message || e.message || "Failed to add member";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className='p-4'>
      <h1 className='text-xl font-semibold mb-2'>
        Members ({members.length}
        {typeof totalCount === "number" ? ` / ${totalCount}` : ""})
      </h1>
      {/* Toasts */}
      <div className='fixed bottom-4 right-4 z-50 space-y-2'>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "rounded px-3 py-2 text-sm shadow " +
              (t.type === "success"
                ? "bg-green-500 text-white"
                : t.type === "error"
                ? "bg-red-500 text-white"
                : "bg-gray-800 text-white")
            }
          >
            {t.message}
          </div>
        ))}
      </div>
      <form className='flex' onSubmit={handleOnSubmit}>
        <input
          type='email'
          name='email'
          placeholder='Member email'
          className='mb-4 p-2 border border-gray-300 rounded w-1/2 max-w-xl'
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          required
        />
        <button
          className='mb-4 ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50'
          disabled={addLoading || !emailInput}
        >
          {addLoading ? "Adding..." : "Add Member"}
        </button>
      </form>
      {error && <p className='text-red-600 mb-2 text-sm'>{error}</p>}
      {members.map((m) => (
        <div key={m._id} className='border-b border-gray-200 py-2'>
          <p className='flex items-center gap-2 max-w-6xl'>
            <span className='font-semibold flex-1'>{m.name}</span>
            <span className='text-gray-500 flex-[2] truncate'>{m.email}</span>
            <span className='text-gray-400 flex-[2]'>{m.isOwner ? "Owner" : m.role}</span>
            <button
              type='button'
              onClick={() => !m.isOwner && handleRemoveClick(m._id, m.name)}
              className={`p-1 rounded ${
                m.isOwner ? "opacity-40 cursor-not-allowed" : "hover:bg-red-50"
              }`}
              aria-label='delete user'
              title={m.isOwner ? "You can't remove the group owner" : "delete user"}
              disabled={!!deletingIds[m._id] || !!m.isOwner}
            >
              <img
                src={deleteIcon}
                alt='delete user'
                className={`w-5 h-5 shrink-0 ${
                  deletingIds[m._id] ? "opacity-50" : "cursor-pointer"
                }`}
              />
            </button>
            <button
              type='button'
              onClick={() => handleSettingsClick(m._id, m.name)}
              className='p-1 hover:bg-red-50 rounded'
              aria-label='settings user'
              title='settings user'
            >
              <img
                src={settingsIcon}
                alt='settings user'
                className='w-5 h-5 cursor-pointer shrink-0'
              />
            </button>
          </p>
        </div>
      ))}
      <div className='mt-3'>
        {loading && <p className='text-sm text-gray-500'>Loading...</p>}
        {!loading && nextCursor && (
          <button
            onClick={loadMore}
            className='px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm'
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}

export default Members;
