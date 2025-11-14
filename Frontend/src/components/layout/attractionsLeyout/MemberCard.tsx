interface Member {
  _id: string;
  name: string;
  email: string;
}

interface MemberCardProps {
  member: Member;
  isSelected: boolean;
  onClick: () => void;
}

function MemberCard({ member, isSelected, onClick }: MemberCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-3 border-b border-gray-200 cursor-pointer transition-colors ${
        isSelected ? "bg-blue-100 border-l-4 border-l-blue-500" : "hover:bg-gray-50"
      }`}
    >
      <h3 className='font-semibold text-base text-gray-800'>{member.name}</h3>
      <p className='text-sm text-gray-600'>{member.email}</p>
    </div>
  );
}

export default MemberCard;
