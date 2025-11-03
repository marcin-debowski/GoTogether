import ChoseCalendar from "../components/layout/attractionsLeyout/ChoseCalendar";

function Attractions() {
  return (
    <div className='flex flex-col h-full'>
      <h1 className='text-2xl font-bold mb-4'>Attractions</h1>

      <div className='flex-1 overflow-hidden'>
        <ChoseCalendar />
      </div>
    </div>
  );
}
export default Attractions;
