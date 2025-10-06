import { BrowserRouter, Routes, Route } from "react-router-dom";
import Attractions from "../pages/Attractions";
import Costs from "../pages/Costs";
import Dates from "../pages/Dates";
import Places from "../pages/Places";
import Members from "../pages/Members";
import Content from "../components/layout/Content";

function AppRouter() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Content />}>
            <Route path='dates' element={<Dates />} />
            <Route path='places' element={<Places />} />
            <Route path='attractions' element={<Attractions />} />
            <Route path='costs' element={<Costs />} />
            <Route path='members' element={<Members />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}
export default AppRouter;
