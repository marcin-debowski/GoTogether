import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

function Content() {
  return (
    <div className='flex h-screen'>
      <Sidebar />
      <main className='flex-1 p-4 bg-white'>
        <h1 className='text-2xl font-bold mb-4'>Dashboard</h1>
        <Outlet />
      </main>
    </div>
  );
}
export default Content;
