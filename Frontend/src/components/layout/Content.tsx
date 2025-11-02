import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

function Content() {
  return (
    <div className='flex h-screen overflow-hidden'>
      <Sidebar />
      <main className='flex-1 p-4 lg:p-6 bg-white overflow-y-auto'>
        <Outlet />
      </main>
    </div>
  );
}
export default Content;
