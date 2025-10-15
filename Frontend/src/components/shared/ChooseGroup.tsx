import { useCallback, useEffect, useState } from "react";
import CreateGroup from "./CreateGroup";
import axios from "axios";

function ChooseGroup() {
  const [showCreate, setShowCreate] = useState(false);
  const [value, setValue] = useState("");

  type GroupSummary = { _id: string; name: string; slug: string; membersCount?: number };
  const [groupList, setGroupList] = useState<GroupSummary[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setValue(v);
    if (v === "add") {
      setShowCreate(true);
    }
  }

  const refetch = useCallback(async (signal?: AbortSignal) => {
    setGroupsLoading(true);
    setGroupsError(null);
    try {
      const res = await axios.get("/api/groups/list", {
        withCredentials: true,
        signal,
      });
      const groups: GroupSummary[] = res.data?.groups ?? [];
      setGroupList(groups);
      // Ustaw wybór stabilnie względem bieżącego stanu
      setValue((prev) => {
        if (groups.length === 0) return "";
        const slugs = groups.map((g) => g.slug);
        if (!prev || (prev !== "add" && !slugs.includes(prev))) {
          return groups[0].slug;
        }
        return prev;
      });
    } catch (err: any) {
      if (axios.isCancel?.(err) || err?.name === "CanceledError") return;
      setGroupsError(err?.response?.data?.message || err.message || "Failed to load groups");
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refetch(controller.signal);
    return () => controller.abort();
  }, [refetch]);

  return (
    <div className='relative'>
      <select
        name='groups'
        id='groups'
        className='p-2 text-3xl w-full hover:bg-gray-900'
        value={value}
        onChange={handleChange}
      >
        {/* Placeholder gdy brak grup */}
        {groupList.length === 0 && !groupsLoading && (
          <option value='' disabled>
            No groups
          </option>
        )}
        {groupsLoading && (
          <option value='' disabled>
            Loading...
          </option>
        )}
        {groupList.map((g) => (
          <option key={g._id} value={g.slug}>
            {g.name}
          </option>
        ))}
        <option value='add'>Add +</option>
      </select>

      {groupsError && <p className='mt-2 text-sm text-red-600'>{groupsError}</p>}

      {showCreate && (
        <CreateGroup
          onClose={() => setShowCreate(false)}
          onCreated={(group) => {
            if (group?.slug) setValue(group.slug);
            void refetch();
          }}
        />
      )}
    </div>
  );
}

export default ChooseGroup;
