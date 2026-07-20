import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { ChatContext } from "../../contex/ChatContext";
import { AuthContext } from "../../contex/AuthContex";
import {
  ShieldAlert,
  Slash,
  Copy,
  Check,
  Users,
  Image as ImageIcon,
  Bot,
  ExternalLink,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

const RightSidebar = () => {
  const { selectedUser, selectedGroup, messages, deleteGroup } = useContext(ChatContext);
  const { logout, onlineUsers, authUser, toggleBlockUser, reportUser } = useContext(AuthContext);
  const [msgImages, setMsgImages] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setMsgImages(
      messages.filter((msg) => msg.image).map((msg) => msg.image)
    );
  }, [messages]);

  const isAdmin = selectedGroup?.admins?.some(
    (admin) => (admin._id || admin) === authUser?._id
  );

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the group "${selectedGroup.name}"? This will delete all messages and remove all members.`
    );
    if (confirmDelete) {
      await deleteGroup(selectedGroup._id);
    }
  };

  const copyInviteCode = () => {
    if (selectedGroup?.inviteLink) {
      navigator.clipboard.writeText(selectedGroup.inviteLink);
      setCopiedLink(true);
      toast.success("Invite link code copied!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleBlock = async () => {
    if (!selectedUser) return;
    await toggleBlockUser(selectedUser._id);
  };

  const handleReport = async () => {
    if (!selectedUser) return;
    const reported = await reportUser(selectedUser._id);
    if (reported) {
      toast.success("User reported successfully.");
    }
  };

  const isBlocked = authUser?.blockedUsers?.includes(selectedUser?._id);

  // If AI chat selected
  if (selectedGroup?.isAi) {
    return (
      <div className="bg-black/15 w-full relative text-white overflow-y-auto p-4 flex flex-col items-center gap-6 border-l border-white/5 max-md:hidden select-none">
        <div className="pt-8 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center border border-white/10 shadow-lg">
            <Bot className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-violet-300">Connectify AI Companion</h2>
            <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block pulse-green" /> Live Assistant
            </p>
          </div>
        </div>

        <div className="w-full bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-3.5 text-xs">
          <h4 className="font-semibold text-gray-300 uppercase tracking-wider text-[10px]">What I Can Do</h4>
          <ul className="space-y-2 text-gray-400 list-disc pl-4 leading-relaxed">
            <li>Summarize conversation transcripts.</li>
            <li>Translate chats into Spanish, French, Hindi, and more.</li>
            <li>Answer complex prompts or code snippets directly.</li>
            <li>Suggest smart quick-replies.</li>
          </ul>
        </div>

        <div className="w-full bg-white/5 border border-white/5 rounded-xl p-3.5 text-xs text-gray-400 leading-relaxed">
          <h4 className="font-semibold text-gray-300 uppercase tracking-wider text-[10px] mb-2">Configuration</h4>
          For live AI generation, verify that `GEMINI_API_KEY` is present in your server `.env` file.
        </div>
      </div>
    );
  }

  // If Group selected
  if (selectedGroup) {
    return (
      <div className="bg-black/15 w-full relative text-white overflow-y-auto p-4 flex flex-col gap-5 border-l border-white/5 max-md:hidden">
        {/* Profile Card */}
        <div className="pt-6 flex flex-col items-center gap-3 text-center">
          <img
            src={selectedGroup.avatar || assets.avatar_icon}
            alt=""
            className="w-16 h-16 rounded-xl object-cover border border-white/10"
          />
          <div>
            <h2 className="text-base font-semibold">{selectedGroup.name}</h2>
            <p className="text-xs text-gray-400 mt-1">{selectedGroup.description || "No description provided."}</p>
          </div>
        </div>

        <hr className="border-white/5" />

        {/* Invite Link Section */}
        {selectedGroup.inviteLink && (
          <div className="bg-white/5 border border-white/5 rounded-xl p-3">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1">
              Invite Code Link
            </label>
            <div className="flex items-center justify-between gap-2 bg-black/20 p-2 rounded-lg text-xs">
              <span className="font-mono text-violet-300 select-all">{selectedGroup.inviteLink}</span>
              <button
                onClick={copyInviteCode}
                className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold uppercase tracking-wider">
            <Users className="w-4 h-4 text-violet-400" /> Members ({selectedGroup.members?.length || 0})
          </div>
          <div className="max-h-[180px] overflow-y-auto space-y-2 bg-black/10 p-2 rounded-lg border border-white/5">
            {selectedGroup.members?.map((member) => (
              <div key={member._id} className="flex items-center gap-2 text-xs">
                <img
                  src={member.profilePic || assets.avatar_icon}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover border border-white/10"
                />
                <span className="flex-1 truncate">{member.fullName}</span>
                {selectedGroup.admins?.some(admin => (admin._id || admin) === member._id) && (
                  <span className="text-[9px] bg-violet-600/30 text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/20 font-semibold uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Shared Media */}
        {msgImages.length > 0 && (
          <div className="space-y-2.5">
            <label className="text-xs text-gray-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-violet-400" /> Shared Media
            </label>
            <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[140px] p-1 bg-black/10 rounded-lg border border-white/5">
              {msgImages.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => window.open(url)}
                  className="cursor-pointer aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition relative group"
                >
                  <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Group Administration Action */}
        {isAdmin && (
          <div className="mt-auto pt-4">
            <button
              onClick={handleDeleteGroup}
              className="w-full py-2.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete Group
            </button>
          </div>
        )}
      </div>
    );
  }

  // If Direct User Chat selected
  return selectedUser ? (
    <div className="bg-black/15 w-full relative text-white overflow-y-auto p-4 flex flex-col gap-5 border-l border-white/5 max-md:hidden">
      {/* Profile Card */}
      <div className="pt-6 flex flex-col items-center gap-3 text-center animate-slide-up">
        <div className="relative">
          <img
            src={selectedUser?.profilePic || assets.avatar_icon}
            alt=""
            className="w-16 h-16 rounded-full object-cover border-2 border-white/10"
          />
          {onlineUsers.includes(selectedUser._id) ? (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#161224] pulse-green"></span>
          ) : (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-gray-500 rounded-full border-2 border-[#161224]"></span>
          )}
        </div>
        <div>
          <h2 className="text-base font-semibold">{selectedUser.fullName}</h2>
          <p className="text-xs text-violet-400 italic mt-0.5">{selectedUser.customStatus || "No status message set"}</p>
          <p className="text-xs text-gray-400 mt-2.5 max-w-[200px] leading-relaxed">{selectedUser.bio || "No bio details shared."}</p>
        </div>
      </div>

      <hr className="border-white/5" />

      {/* Shared Media */}
      {msgImages.length > 0 && (
        <div className="space-y-2.5">
          <label className="text-xs text-gray-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-violet-400" /> Shared Media
          </label>
          <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[140px] p-1 bg-black/10 rounded-lg border border-white/5">
            {msgImages.map((url, idx) => (
              <div
                key={idx}
                onClick={() => window.open(url)}
                className="cursor-pointer aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition relative group"
              >
                <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Actions */}
      <div className="mt-auto space-y-2 pt-4">
        <button
          onClick={handleBlock}
          className={`w-full py-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition ${
            isBlocked
              ? "border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/20"
              : "border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
          }`}
        >
          <Slash className="w-4 h-4" />
          {isBlocked ? "Unblock Contact" : "Block User"}
        </button>
        
        <button
          onClick={handleReport}
          className="w-full py-2.5 rounded-lg border border-yellow-500/20 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition"
        >
          <ShieldAlert className="w-4 h-4" />
          Report Account
        </button>
      </div>
    </div>
  ) : null;
};

export default RightSidebar;
