import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

interface Member {
  _id: string;
  name: string;
  email: string;
}

interface AddMemberToPaymentProps {
  setShowAddMember: (value: boolean) => void;
  onAddMembers: (members: { userId: string; name: string; amount: number }[]) => void;
  addedMembers: string[];
}

function AddMemberToPayment({
  setShowAddMember,
  onAddMembers,
  addedMembers,
}: AddMemberToPaymentProps) {
  const { slug } = useParams<{ slug: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await axios.get(`/api/groups/${slug}/members`, {
          withCredentials: true,
        });
        setMembers(response.data.members);
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMembers();
    }
  }, [slug]);

  const handleToggleMember = (memberId: string, memberName: string) => {
    // Nie pozwól odznaczyć już dodanego członka
    if (addedMembers.includes(memberName)) {
      return;
    }

    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleAddSelected = () => {
    const newMembers = Array.from(selectedMembers)
      .map((memberId) => {
        const member = members.find((m) => m._id === memberId);
        return member ? { userId: member._id, name: member.name, amount: 0 } : null;
      })
      .filter((m): m is { userId: string; name: string; amount: number } => m !== null);

    onAddMembers(newMembers);
    // Wyczyść tylko nowo dodanych, nie zamykaj modala
    setSelectedMembers(new Set());
  };

  const handleSelectAll = () => {
    const allAvailableIds = new Set(
      members.filter((m) => !addedMembers.includes(m.name)).map((m) => m._id)
    );
    setSelectedMembers(allAvailableIds);
  };

  return (
    <div className='flex flex-col p-4 border border-blue-300 bg-blue-50 rounded max-h-96 overflow-y-auto'>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='font-semibold'>Select Members</h3>
        <button
          onClick={handleSelectAll}
          className='px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600'
          disabled={loading || members.every((m) => addedMembers.includes(m.name))}
        >
          Select All
        </button>
      </div>

      {loading ? (
        <p className='text-gray-500'>Loading members...</p>
      ) : members.length === 0 ? (
        <p className='text-gray-500'>No members found</p>
      ) : (
        <div className='space-y-2 mb-4'>
          {members.map((member) => {
            const alreadyAdded = addedMembers.includes(member.name);
            return (
              <label
                key={member._id}
                className={`flex items-center gap-2 p-2 border rounded ${
                  alreadyAdded
                    ? "border-green-500 bg-green-50 cursor-not-allowed"
                    : "border-gray-300 hover:bg-blue-100 cursor-pointer"
                }`}
              >
                <input
                  type='checkbox'
                  checked={alreadyAdded || selectedMembers.has(member._id)}
                  onChange={() => handleToggleMember(member._id, member.name)}
                  className='w-4 h-4'
                  disabled={alreadyAdded}
                />
                <div className='flex-1'>
                  <p className='font-semibold'>{member.name}</p>
                  <p className='text-sm text-gray-500'>{member.email}</p>
                </div>
                {alreadyAdded && (
                  <span className='text-xs text-green-600 font-semibold'>Added</span>
                )}
              </label>
            );
          })}
        </div>
      )}

      <div className='flex gap-2'>
        <button
          className='flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400'
          type='button'
          onClick={handleAddSelected}
          disabled={selectedMembers.size === 0}
        >
          Add Selected ({selectedMembers.size})
        </button>
        <button
          className='flex-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600'
          type='button'
          onClick={() => setShowAddMember(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
export default AddMemberToPayment;
