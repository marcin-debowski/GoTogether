import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Attractions from "../pages/Attractions";
import Costs from "../pages/Costs";
import Dates from "../pages/Dates";
import Places from "../pages/Places";
import Members from "../pages/Members";
import Content from "../components/layout/Content";
import Login from "../pages/Login";
import Register from "../pages/Register";
import RequireAuth from "../components/auth/RequireAuth";
import { AuthProvider, useAuth } from "../context/AuthContext";
import MyAttractions from "../components/AttractionsGroup/MyAttractions";
import OtherAttractions from "../components/AttractionsGroup/OtherAttractions";

import type { ReactElement } from "react";
import { useLocation } from "react-router-dom";
import { ChooseGroupContent } from "../components/layout/ChoseGroupContent";

function PublicOnly({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div />; // spinner placeholder
  if (user) {
    const dest = (location.state as any)?.from?.pathname || "/";
    return <Navigate to={dest} replace />;
  }
  return children;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route
            path='/login'
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />
          <Route
            path='/register'
            element={
              <PublicOnly>
                <Register />
              </PublicOnly>
            }
          />
          {/* Protected */}
          <Route
            path='/'
            element={
              <RequireAuth>
                <ChooseGroupContent />
              </RequireAuth>
            }
          />
          <Route
            path='/:slug'
            element={
              <RequireAuth>
                <Content />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to='dates' replace />} />
            <Route path='dates' element={<Dates />} />
            <Route path='places' element={<Places />} />
            <Route path='attractions' element={<Attractions />}>
              <Route index element={<Navigate to='mycalendar' replace />} />
              <Route path='mycalendar' element={<MyAttractions />} />
              <Route path='othercalendar' element={<OtherAttractions />} />
            </Route>
            <Route path='costs' element={<Costs />} />
            <Route path='members' element={<Members />} />
          </Route>

          {/* Fallback */}
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
export default AppRouter;
