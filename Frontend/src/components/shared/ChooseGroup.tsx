function ChooseGroup() {
  return (
    <select name='groups' id='groups' className='p-2 text-3xl w-full hover:bg-gray-900'>
      <option value='group1' selected>
        Group 1
      </option>
      <option value='group2'>Group 2</option>
      <option value='group3'>Add +</option>
    </select>
  );
}
export default ChooseGroup;
