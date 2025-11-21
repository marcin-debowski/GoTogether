import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import AddMemberToPayment from "./AddMemberToPayment";
import PaymentMember from "./PaymentMember";

interface Member {
  userId: string;
  name: string;
  amount: number;
  isCustomAmount?: boolean; // true = ustawione przez usera, false/undefined = auto
}

interface AddPaymentProps {
  onPaymentAdded?: () => void;
}

function AddPayment({ onPaymentAdded }: AddPaymentProps) {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [showAddMember, setShowAddMember] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast notifications
  type ToastType = "success" | "error" | "info";
  type Toast = { id: number; type: ToastType; message: string; leaving?: boolean };
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = ++toastIdRef.current;
    const displayMs = 5000;
    const fadeMs = 1000;
    setToasts((prev) => [...prev, { id, type, message }]);

    // trigger fade-out a bit before removal
    window.setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    }, Math.max(0, displayMs - fadeMs));

    // remove after animation completes
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, displayMs);
  };

  // Form fields state
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");

  // Check if basic fields are filled
  const isFormValid = amount.trim() !== "" && description.trim() !== "" && category.trim() !== "";
  const isSubmitValid = isFormValid && members.length > 0;

  const recalculateAmounts = (membersList: Member[], totalAmount: number) => {
    const customAmounts = membersList
      .filter((m) => m.isCustomAmount)
      .reduce((sum, m) => sum + m.amount, 0);
    const membersWithoutCustom = membersList.filter((m) => !m.isCustomAmount);

    if (membersWithoutCustom.length === 0) return membersList;

    // Pracuj w centach żeby uniknąć problemów z floating point
    const remainingCents = Math.round((totalAmount - customAmounts) * 100);
    const baseAmountCents = Math.floor(remainingCents / membersWithoutCustom.length);
    const remainderCents = remainingCents % membersWithoutCustom.length;

    // Mapa: które osoby bez custom amount dostają +1 cent
    const withoutCustomMap = new Map<string, number>();
    membersWithoutCustom.forEach((m, idx) => {
      const extraCent = idx < remainderCents ? 1 : 0;
      withoutCustomMap.set(m.userId, (baseAmountCents + extraCent) / 100);
    });

    return membersList.map((m) =>
      m.isCustomAmount ? m : { ...m, amount: withoutCustomMap.get(m.userId)! }
    );
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);

    // Przelicz kwoty członków gdy zmienia się total amount
    const totalAmount = parseFloat(value) || 0;
    if (members.length > 0) {
      const recalculated = recalculateAmounts(members, totalAmount);
      setMembers(recalculated);
    }
  };

  const handleAddMembers = (newMembers: Member[]) => {
    // Filtruj użytkowników, którzy jeszcze nie są dodani
    const uniqueNew = newMembers.filter(
      (newMember) => !members.some((m) => m.name === newMember.name)
    );

    // Dodaj nowych członków i przelicz kwoty
    const updatedMembers = [...members, ...uniqueNew];
    const totalAmount = parseFloat(amount) || 0;
    const recalculated = recalculateAmounts(updatedMembers, totalAmount);
    setMembers(recalculated);
  };

  const handleRemoveMember = (index: number) => {
    const updatedMembers = members.filter((_, i) => i !== index);
    const totalAmount = parseFloat(amount) || 0;
    const recalculated = recalculateAmounts(updatedMembers, totalAmount);
    setMembers(recalculated);
  };

  const handleUpdateAmount = (index: number, newAmount: number) => {
    const updatedMembers = members.map((member, i) =>
      i === index ? { ...member, amount: newAmount, isCustomAmount: true } : member
    );

    const totalAmount = parseFloat(amount) || 0;
    const recalculated = recalculateAmounts(updatedMembers, totalAmount);
    setMembers(recalculated);
  };

  const handleSubmit = async () => {
    if (!isSubmitValid || !slug || !user) return;

    // Debug: sprawdź czy user.id istnieje
    if (!user.id) {
      console.error("User.id is undefined:", user);
      showToast("User not properly authenticated", "error");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Convert PLN to cents and prepare splits
      const amountCents = Math.round(parseFloat(amount) * 100);
      const splits = members.map((member) => ({
        userId: member.userId,
        amountCents: Math.round(member.amount * 100),
      }));

      // Validate that splits sum equals total (with small tolerance for rounding)
      const splitsSum = splits.reduce((sum, split) => sum + split.amountCents, 0);
      if (Math.abs(splitsSum - amountCents) > 1) {
        setError(
          `Sum of member amounts (${(splitsSum / 100).toFixed(
            2
          )} PLN) does not equal total amount (${amount} PLN)`
        );
        setLoading(false);
        return;
      }

      const payload = {
        payerId: user.id,
        description,
        category,
        date: date || new Date().toISOString(),
        amountCents,
        splits,
      };

      console.log("Sending payload:", payload);

      await axios.post(`/api/payments/${slug}/addpayments`, payload, {
        withCredentials: true,
      });

      // Reset form on success
      setAmount("");
      setDescription("");
      setCategory("");
      setDate("");
      setMembers([]);
      setShowAddMember(false);

      showToast("Payment added successfully!", "success");

      // Odśwież balans
      if (onPaymentAdded) {
        onPaymentAdded();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add payment");
      showToast(err.response?.data?.message || "Failed to add payment", "error");
      console.error("Error adding payment:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col space-y-4'>
      <h2>Add Payment</h2>

      {/* Toasts */}
      <div className='fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none'>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "rounded px-3 py-2 text-sm shadow transition ease-out duration-1000 transform pointer-events-auto " +
              (t.type === "success"
                ? "bg-green-500 text-white"
                : t.type === "error"
                ? "bg-red-500 text-white"
                : "bg-gray-800 text-white") +
              (t.leaving ? " opacity-0 translate-y-2" : " opacity-100 translate-y-0")
            }
          >
            {t.message}
          </div>
        ))}
      </div>

      {error && (
        <div className='p-3 bg-red-100 border border-red-400 text-red-700 rounded'>{error}</div>
      )}

      <div className='flex flex-wrap gap-2'>
        <input
          className='flex-1 border-b border-gray-200'
          type='number'
          placeholder='Amount'
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
        />
        <input
          className='flex-1 border-b border-gray-200'
          type='text'
          placeholder='Description'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className='flex-1 border-b border-gray-200'
          type='text'
          placeholder='Category'
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <input
          className='flex-1 border-b border-gray-200'
          type='date'
          placeholder='Date'
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <PaymentMember
        members={members}
        onRemoveMember={handleRemoveMember}
        onUpdateAmount={handleUpdateAmount}
      />

      <button
        className='w-full px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed'
        type='button'
        onClick={() => setShowAddMember(!showAddMember)}
        disabled={!isFormValid}
      >
        + Add Member
      </button>

      {showAddMember && (
        <AddMemberToPayment
          setShowAddMember={setShowAddMember}
          onAddMembers={handleAddMembers}
          addedMembers={members.map((m) => m.name)}
        />
      )}

      <button
        className='mb-4 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed'
        type='button'
        onClick={handleSubmit}
        disabled={!isSubmitValid || loading}
      >
        {loading ? "Adding..." : "Add Payment"}
      </button>
    </div>
  );
}
export default AddPayment;
