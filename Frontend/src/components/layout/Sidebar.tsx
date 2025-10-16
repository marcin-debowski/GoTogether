import ChooseGroup from "../shared/ChooseGroup";
import MenuButton from "../shared/MenuButton";
import ProfileSettings from "../shared/ProfileSettings";
import { useParams } from "react-router-dom";

function Sidebar() {
  const { slug } = useParams<{ slug?: string }>();
  const base = slug ? `/${slug}` : "";
  return (
    <aside className='left-0 top-0 w-xs bottom-0 flex flex-col border border-gray-300 rounded-r-xl'>
      <ChooseGroup />
      <img src='/group.png' alt='Logo' className='w-xs h-xs mx-auto rounded-full p-5' />
      <nav className='flex flex-col gap-2'>
        <MenuButton label='Date' path={`${base}/dates`} />
        <MenuButton label='Place' path={`${base}/places`} />
        <MenuButton label='Attractions' path={`${base}/attractions`} />
        <MenuButton label='Costs' path={`${base}/costs`} />
        <MenuButton label='Members' path={`${base}/members`} />
      </nav>
      <footer className='mt-auto w-full'>
        <ProfileSettings />
      </footer>
    </aside>
  );
}

export default Sidebar;
