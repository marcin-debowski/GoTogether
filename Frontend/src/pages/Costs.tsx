import { useState } from "react";
import AddPayment from "../components/payments/AddPayment";
import Bilans from "../components/payments/Bilans";

function Costs() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAddPayment, setShowAddPayment] = useState(false);

  const handlePaymentAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
    setShowAddPayment(false); // Zamknij formularz po dodaniu płatności
  };

  return (
    <div>
      <h1 className='text-2xl font-bold mb-4'>Costs</h1>
      <p>Welcome to the costs page!</p>

      <div className='w-full mx-auto mt-6'>
        <button
          onClick={() => setShowAddPayment(!showAddPayment)}
          className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4'
        >
          {showAddPayment ? "- Close" : "+ Add New Payment"}
        </button>

        {showAddPayment && <AddPayment onPaymentAdded={handlePaymentAdded} />}
      </div>

      <div className='w-1/2 mx-auto mt-6'>
        <Bilans refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}
export default Costs;
