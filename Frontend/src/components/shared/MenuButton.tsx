import { NavLink } from "react-router-dom";

function MenuButton(props: { label: string; path: string }) {
  return (
    <NavLink to={props.path} className='text-xl hover:bg-gray-500 p-2 text-center'>
      {props.label}
    </NavLink>
  );
}

export default MenuButton;
