import ChooseGroup from "../shared/ChooseGroup";
import MenuButton from "../shared/MenuButton";
import ProfileSettings from "../shared/ProfileSettings";

function Sidebar() {
  return (
    <aside className='left-0 top-0 w-xs bottom-0 flex flex-col border border-gray-300 rounded-r-xl'>
      <ChooseGroup />
      <img src='/group.png' alt='Logo' className='w-xs h-xs mx-auto rounded-full p-5' />
      <nav className='flex flex-col gap-2'>
        <MenuButton label='Date' path='/dates' />
        <MenuButton label='Place' path='/places' />
        <MenuButton label='Attractions' path='/attractions' />
        <MenuButton label='Costs' path='/costs' />
        <MenuButton label='Members' path='/members' />
      </nav>
      <footer className='mt-auto w-full'>
        <ProfileSettings />
      </footer>
    </aside>
  );
}

export default Sidebar;
