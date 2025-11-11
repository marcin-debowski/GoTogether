import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface GroupData {
  _id: string;
  name: string;
  slug: string;
  place?: string;
  startDate?: string;
  endDate?: string;
  membersCount?: number;
}

interface GroupContextType {
  currentGroup: GroupData | null;
  setCurrentGroup: (group: GroupData | null) => void;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: ReactNode }) {
  const [currentGroup, setCurrentGroup] = useState<GroupData | null>(null);

  return (
    <GroupContext.Provider value={{ currentGroup, setCurrentGroup }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error("useGroup must be used within GroupProvider");
  }
  return context;
}
