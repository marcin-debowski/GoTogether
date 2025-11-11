import { useState } from "react";
import ChooseGroup from "../shared/ChooseGroup";
import MenuButton from "../shared/MenuButton";
import ProfileSettings from "../shared/ProfileSettings";
import { useParams } from "react-router-dom";
import { useGroup } from "../../context/GroupContext";

function Sidebar() {
  const { slug } = useParams<{ slug?: string }>();
  const base = slug ? `/${slug}` : "";
  const [isOpen, setIsOpen] = useState(false);
  const { currentGroup } = useGroup();

  const formatDateRange = () => {
    if (!currentGroup?.startDate || !currentGroup?.endDate) {
      return "No dates set";
    }
    const start = new Date(currentGroup.startDate).toLocaleDateString();
    const end = new Date(currentGroup.endDate).toLocaleDateString();
    return `${start} - ${end}`;
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md hover:bg-gray-700'
        aria-label='Toggle menu'
      >
        <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          {isOpen ? (
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          ) : (
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 6h16M4 12h16M4 18h16'
            />
          )}
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className='lg:hidden fixed inset-0 bg-black/50 z-30'
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white border-r border-gray-300
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <ChooseGroup />
        <img src='/group.png' alt='Logo' className='w-32 h-32 mx-auto rounded-full p-5' />
        <nav className='flex flex-col gap-2 px-4'>
          <div className='flex items-center gap-3 p-2 rounded-lg text-gray-700 bg-gray-100'>
            <span className='font-medium'>📅 {formatDateRange()}</span>
          </div>
          <div className='flex items-center gap-3 p-2 rounded-lg text-gray-700 bg-gray-100'>
            <span className='font-medium'>📍 {currentGroup?.place || "No place set"}</span>
          </div>
          {/* <MenuButton label='Date' path={`${base}/dates`} onClick={() => setIsOpen(false)} />
          <MenuButton label='Place' path={`${base}/places`} onClick={() => setIsOpen(false)} /> */}
          <MenuButton
            label='Attractions'
            path={`${base}/attractions`}
            onClick={() => setIsOpen(false)}
          />
          <MenuButton label='Costs' path={`${base}/costs`} onClick={() => setIsOpen(false)} />
          <MenuButton label='Members' path={`${base}/members`} onClick={() => setIsOpen(false)} />
        </nav>
        <footer className='mt-auto w-full'>
          <ProfileSettings />
        </footer>
      </aside>
    </>
  );
}

export default Sidebar;
