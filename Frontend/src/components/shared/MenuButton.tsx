import { NavLink } from "react-router-dom";

function MenuButton(props: { label: string; path: string; onClick?: () => void }) {
  return (
    <NavLink
      to={props.path}
      className={({ isActive }) =>
        `
        relative px-4 py-3 rounded-lg text-base font-medium
        transition-all duration-200 ease-in-out
        ${
          isActive
            ? "bg-blue-500 text-white shadow-md"
            : "text-gray-700 hover:bg-gray-100 hover:text-blue-600 hover:shadow-sm hover:translate-x-1"
        }
      `
      }
      onClick={props.onClick}
    >
      {props.label}
    </NavLink>
  );
}

export default MenuButton;
