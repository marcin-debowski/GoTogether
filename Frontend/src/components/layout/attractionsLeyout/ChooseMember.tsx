import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import MemberCard from "./MemberCard";

interface Member {
  _id: string;
  name: string;
  email: string;
}

interface ChooseMemberProps {
  onMemberSelect: (memberId: string) => void;
  selectedMemberId: string | null;
}

function ChooseMember({ onMemberSelect, selectedMemberId }: ChooseMemberProps) {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`/api/groups/${slug}/members`, {
          withCredentials: true,
        });
        
        // Filter out current user
        const filteredMembers = (response.data.members || []).filter(
          (member: Member) => member._id !== user?.id
        );
        
        setMembers(filteredMembers);
        // Auto-select first member if none selected
        if (filteredMembers.length > 0 && !selectedMemberId) {
          onMemberSelect(filteredMembers[0]._id);
        }
      } catch (err: any) {
        console.error("Error fetching members:", err);
        setError(err.response?.data?.message || "Failed to load members");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMembers();
    }
  }, [slug, user]);

  return (
    <div className='flex flex-col rounded-tr-lg h-[calc(100%-1rem)] border-r border-t mt-4 '>
      <div className='flex items-center'>
        <h1 className='text-2xl font-bold mb-4 p-4 pb-0'>Members</h1>
      </div>
      <div className='flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2'>
        {loading ? (
          <div className='text-center py-8 text-gray-500'>Loading members...</div>
        ) : error ? (
          <div className='text-center py-8 text-red-500'>{error}</div>
        ) : members.length === 0 ? (
          <div className='text-center py-8 text-gray-400'>No members found</div>
        ) : (
          members.map((member) => (
            <MemberCard
              key={member._id}
              member={member}
              isSelected={member._id === selectedMemberId}
              onClick={() => onMemberSelect(member._id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ChooseMember;
