import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { ReactNode } from "react";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className='p-4 text-sm text-gray-500'>Ładowanie...</div>;
  if (!user) return <Navigate to='/login' replace state={{ from: location }} />;
  return <>{children}</>;
}
