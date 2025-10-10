import { useAuth } from "../../context/AuthContext";

function ProfileSettings() {
  const { user, loading, logout } = useAuth();

  const name = loading ? "Ładowanie..." : user?.name || user?.email || "Profil";

  return (
    <div className='flex items-center w-full p-4 hover:bg-gray-500 rounded-r-xl'>
      <button
        className='flex items-center flex-1 text-left'
        type='button'
        aria-label='Ustawienia profilu'
      >
        <img src='/profile.png' alt='Profile' className='w-10 h-10 rounded-full mr-4' />
        <p className='truncate'>{name}</p>
      </button>
      <button
        type='button'
        onClick={logout}
        className='ml-3 p-2 rounded bg-gray-400 hover:bg-gray-200'
        aria-label='Wyloguj'
        title='Wyloguj'
      >
        <img src='/logout.png' alt='Wyloguj' className='w-5 h-5' />
      </button>
    </div>
  );
}
export default ProfileSettings;
