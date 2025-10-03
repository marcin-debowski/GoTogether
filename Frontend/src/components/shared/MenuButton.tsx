function MenuButton(props: { label: string }) {
  return <button className='text-xl hover:bg-gray-500 p-2'>{props.label}</button>;
}

export default MenuButton;
