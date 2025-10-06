function ProfileSettings() {
  return (
    <button className='flex justify-center items-center w-full p-4 hover:bg-gray-500 rounded-r-xl'>
      <img src='/profile.png' alt='Profile' className='w-10 h-10 rounded-full mr-4' />
      <p>Profile Name</p>
    </button>
  );
}
export default ProfileSettings;
