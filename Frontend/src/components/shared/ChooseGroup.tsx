import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CreateGroup from "./CreateGroup";
import axios from "axios";
import { useGroup } from "../../context/GroupContext";

function ChooseGroup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [value, setValue] = useState("");
  const { setCurrentGroup } = useGroup();

  type GroupSummary = {
    _id: string;
    name: string;
    slug: string;
    membersCount?: number;
    place?: string;
    startDate?: string;
    endDate?: string;
  };
  const [groupList, setGroupList] = useState<GroupSummary[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    if (v === "add") {
      setShowCreate(true);
      return;
    }
    setValue(v);
    // derive current child route from URL: /:slug/:child
    const parts = location.pathname.split("/").filter(Boolean);
    const currentChild = parts[1] || "dates";
    navigate(`/${v}/${currentChild}`);
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
        const parts = location.pathname.split("/").filter(Boolean);
        const routeSlug = parts[0];
        // 1) jeśli w URL jest slug i istnieje na liście, użyj go
        if (routeSlug && slugs.includes(routeSlug)) return routeSlug;
        // 2) zachowaj poprzedni wybór, jeśli nadal jest dostępny
        if (prev && prev !== "add" && slugs.includes(prev)) return prev;
        // 3) fallback: pierwsza dostępna grupa
        return groups[0].slug;
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

  // Syncuj wartość selecta, gdy URL slug zmieni się ręcznie/nawigacją
  useEffect(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    const routeSlug = parts[0];
    if (!routeSlug) return;
    if (groupList.some((g) => g.slug === routeSlug)) {
      setValue(routeSlug);
    }
  }, [location.pathname, groupList]);

  // Aktualizuj GroupContext gdy zmieni się wybrana grupa
  useEffect(() => {
    const selectedGroup = groupList.find((g) => g.slug === value);
    if (selectedGroup) {
      setCurrentGroup(selectedGroup);
    }
  }, [value]);

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
            // after creating, navigate to new slug with current child route
            const parts = location.pathname.split("/").filter(Boolean);
            const currentChild = parts[1] || "dates";
            navigate(`/${group.slug}/${currentChild}`);
            void refetch();
          }}
        />
      )}
    </div>
  );
}

export default ChooseGroup;
