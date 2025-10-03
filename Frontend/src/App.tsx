import "./App.css";
import Sidebar from "./components/layout/Sidebar";
import Content from "./components/layout/Content";

function App() {
  return (
    <div className='flex h-screen top-0 left-0 w-full'>
      <Sidebar />
      <Content />
    </div>
  );
}

export default App;
