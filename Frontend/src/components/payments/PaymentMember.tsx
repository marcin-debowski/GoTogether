import { useState } from "react";

interface Member {
  name: string;
  amount: number;
  isCustomAmount?: boolean;
}

interface PaymentMemberProps {
  members: Member[];
  onRemoveMember: (index: number) => void;
  onUpdateAmount: (index: number, amount: number) => void;
}

function PaymentMember({ members, onRemoveMember, onUpdateAmount }: PaymentMemberProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");

  const handleStartEdit = (index: number, currentAmount: number) => {
    setEditingIndex(index);
    setEditAmount(currentAmount.toString());
  };

  const handleSaveEdit = (index: number) => {
    const amount = parseFloat(editAmount);
    if (!isNaN(amount) && amount >= 0) {
      onUpdateAmount(index, amount);
    }
    setEditingIndex(null);
    setEditAmount("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditAmount("");
  };

  return (
    <div className='space-y-2'>
      <h3 className='font-semibold'>Members ({members.length}):</h3>

      {members.length === 0 ? (
        <p className='text-gray-500 text-sm'>No members added yet</p>
      ) : (
        members.map((member, index) => (
          <div key={index} className='flex items-center gap-2 p-2 border border-gray-300 rounded'>
            <span className='flex-1'>{member.name}</span>

            {editingIndex === index ? (
              <>
                <input
                  type='number'
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className='w-24 px-2 py-1 border border-blue-300 rounded'
                  autoFocus
                />
                <button
                  className='px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600'
                  type='button'
                  onClick={() => handleSaveEdit(index)}
                >
                  Save
                </button>
                <button
                  className='px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600'
                  type='button'
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span
                  className={`cursor-pointer hover:text-blue-600 ${
                    member.isCustomAmount ? "font-bold text-gray-900" : "font-normal text-gray-500"
                  }`}
                  onClick={() => handleStartEdit(index, member.amount)}
                >
                  {member.amount.toFixed(2)} PLN
                </span>
                <button
                  className='px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600'
                  type='button'
                  onClick={() => onRemoveMember(index)}
                >
                  Remove
                </button>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default PaymentMember;
