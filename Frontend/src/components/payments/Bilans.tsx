import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

interface Balance {
  userId: string;
  name: string;
  email: string;
  paidCents: number;
  owedCents: number;
  netCents: number;
}

interface BilansProps {
  refreshTrigger?: number;
}

function Bilans({ refreshTrigger }: BilansProps) {
  const { slug } = useParams<{ slug: string }>();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`/api/groups/${slug}/balances`, {
          withCredentials: true,
        });
        setBalances(response.data.balances);
      } catch (err: any) {
        console.error("Error fetching balances:", err);
        setError(err.response?.data?.message || "Failed to fetch balances");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBalances();
    }
  }, [slug, refreshTrigger]);

  const formatAmount = (cents: number) => {
    const pln = (cents / 100).toFixed(2);
    return `${pln} PLN`;
  };

  if (loading) {
    return (
      <div className='p-4 border rounded shadow-md'>
        <h2 className='text-xl font-bold mb-4'>Balance</h2>
        <p className='text-gray-500'>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-4 border rounded shadow-md'>
        <h2 className='text-xl font-bold mb-4'>Balance</h2>
        <p className='text-red-500'>{error}</p>
      </div>
    );
  }

  return (
    <div className='p-4 border rounded shadow-md'>
      <h2 className='text-xl font-bold mb-4'>Balance</h2>

      {balances.length === 0 ? (
        <p className='text-gray-500'>No settlement data</p>
      ) : (
        <div className='space-y-2'>
          {balances.map((balance) => (
            <div key={balance.userId} className='border-b border-gray-200 py-3 last:border-b-0'>
              <div className='flex items-center justify-between gap-4'>
                <div className='flex-1'>
                  <p className='font-semibold text-gray-900'>{balance.name}</p>
                  <p className='text-sm text-gray-500'>{balance.email}</p>
                </div>

                <div className='flex-1 text-right'>
                  <p className='text-xs text-gray-500'>Paid: {formatAmount(balance.paidCents)}</p>
                  <p className='text-xs text-gray-500'>Owes: {formatAmount(balance.owedCents)}</p>
                </div>

                <div className='flex-1 text-right'>
                  {balance.netCents > 0 ? (
                    <p className='font-bold text-green-600'>+{formatAmount(balance.netCents)}</p>
                  ) : balance.netCents < 0 ? (
                    <p className='font-bold text-red-600'>{formatAmount(balance.netCents)}</p>
                  ) : (
                    <p className='font-bold text-gray-600'>{formatAmount(balance.netCents)}</p>
                  )}
                  <p className='text-xs text-gray-500'>
                    {balance.netCents > 0
                      ? "To receive"
                      : balance.netCents < 0
                      ? "To pay"
                      : "Settled"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Bilans;
