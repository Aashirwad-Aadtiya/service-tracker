import { Trash2 } from "lucide-react";

const DeleteButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-950 transition"
    title="Delete"
  >
    <Trash2 size={16} />
  </button>
);

export default DeleteButton;
