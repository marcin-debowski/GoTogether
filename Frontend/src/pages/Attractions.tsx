import ChoseCalendar from "../components/layout/attractionsLeyout/ChoseCalendar";

function Attractions() {
  return (
    <div className='flex flex-col h-full'>
      <div className='flex-1 overflow-hidden'>
        <ChoseCalendar />
      </div>
    </div>
  );
}
export default Attractions;
