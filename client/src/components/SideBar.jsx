import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contex/AuthContex";
import { ChatContext } from "../../contex/ChatContext";
import {
  MessageSquare,
  Users,
  Bot,
  Plus,
  Search,
  Settings,
  LogOut,
  X,
  Compass,
} from "lucide-react";
import toast from "react-hot-toast";

const SideBar = () => {
  const {
    getUsers,
    users,
    groups,
    getGroups,
    selectedUser,
    selectedGroup,
    unseenMessages,
    setUnseenMessages,
    selectUserChat,
    selectGroupChat,
    createNewGroup,
    joinGroup,
  } = useContext(ChatContext);

  const { logout, onlineUsers, authUser } = useContext(AuthContext);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("chats"); // chats, groups, ai
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Group creation states
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupAvatar, setGroupAvatar] = useState("");

  // Join group state
  const [inviteLink, setInviteLink] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    getUsers();
    getGroups();
  }, [onlineUsers]);

  // Filter users or groups based on search input
  const filteredUsers = search
    ? users.filter((user) =>
        user.fullName.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const filteredGroups = search
    ? groups.filter((group) =>
        group.name.toLowerCase().includes(search.toLowerCase())
      )
    : groups;

  const handleMemberSelect = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleGroupAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setGroupAvatar(reader.result);
    };
  };

  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Group name is required.");
      return;
    }
    const newGroup = await createNewGroup({
      name: groupName,
      description: groupDesc,
      avatar: groupAvatar,
      members: selectedMembers,
    });
    if (newGroup) {
      setShowCreateModal(false);
      setGroupName("");
      setGroupDesc("");
      setGroupAvatar("");
      setSelectedMembers([]);
      selectGroupChat(newGroup);
    }
  };

  const handleJoinGroupSubmit = async (e) => {
    e.preventDefault();
    if (!inviteLink.trim()) {
      toast.error("Invite link is required.");
      return;
    }
    const joined = await joinGroup(inviteLink);
    if (joined) {
      setShowJoinModal(false);
      setInviteLink("");
      selectGroupChat(joined);
    }
  };

  return (
    <div
      className={`bg-black/20 border-r border-white/5 h-full flex flex-col rounded-l-xl text-white ${
        selectedUser || selectedGroup ? "max-md:hidden" : "w-full"
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300">
              Connectify
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/profile")}
              title="Edit Profile"
              className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-red-400 transition cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab("chats")}
            className={`py-2 rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "chats"
                ? "bg-violet-600/20 text-violet-400 border border-violet-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Chats
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`py-2 rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "groups"
                ? "bg-violet-600/20 text-violet-400 border border-violet-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Groups
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`py-2 rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "ai"
                ? "bg-violet-600/20 text-violet-400 border border-violet-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> AI Companion
          </button>
        </div>

        {/* Search */}
        {activeTab !== "ai" && (
          <div className="bg-white/5 border border-white/5 rounded-lg flex items-center gap-2.5 py-2.5 px-3">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              className="bg-transparent border-none outline-none text-white text-xs placeholder-gray-400 flex-1"
              placeholder={activeTab === "chats" ? "Search contacts..." : "Search groups..."}
            />
          </div>
        )}
      </div>

      {/* Sidebar List Contents */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {/* Chats Tab */}
        {activeTab === "chats" && (
          <>
            {filteredUsers.length === 0 ? (
              <p className="text-xs text-gray-500 text-center mt-6">No users found</p>
            ) : (
              filteredUsers.map((user) => (
                <div
                  onClick={() => selectUserChat(user)}
                  key={user._id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition relative ${
                    selectedUser?._id === user._id ? "bg-white/5 border border-white/10" : ""
                  }`}
                >
                  <div className="relative">
                    <img
                      src={user?.profilePic || assets.avatar_icon}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                    {onlineUsers.includes(user._id) ? (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-[#161224] pulse-green"></span>
                    ) : (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-gray-500 rounded-full border border-[#161224]"></span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="text-sm font-medium truncate">{user.fullName}</h4>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{user.customStatus || user.bio}</p>
                  </div>

                  {unseenMessages?.[user._id] > 0 && (
                    <span className="h-5 min-w-5 px-1 bg-violet-600 text-[10px] font-semibold text-white rounded-full flex justify-center items-center">
                      {unseenMessages[user._id]}
                    </span>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {/* Groups Tab */}
        {activeTab === "groups" && (
          <div className="space-y-3">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 p-1">
              <button
                onClick={() => setShowCreateModal(true)}
                className="py-2 text-[11px] bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg flex items-center justify-center gap-1.5 font-medium transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Create Group
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="py-2 text-[11px] bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg flex items-center justify-center gap-1.5 font-medium transition cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" /> Join Code
              </button>
            </div>

            {filteredGroups.length === 0 ? (
              <p className="text-xs text-gray-500 text-center mt-6">No groups joined yet</p>
            ) : (
              filteredGroups.map((group) => (
                <div
                  onClick={() => selectGroupChat(group)}
                  key={group._id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition border border-transparent ${
                    selectedGroup?._id === group._id ? "bg-white/5 border-white/10" : ""
                  }`}
                >
                  <img
                    src={group?.avatar || assets.avatar_icon}
                    alt="Group Avatar"
                    className="w-10 h-10 rounded-lg object-cover border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{group.name}</h4>
                    <p className="text-xs text-gray-400 truncate">{group.description || `${group.members.length} members`}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* AI Tab */}
        {activeTab === "ai" && (
          <div
            onClick={() => selectGroupChat({ _id: "ai-assistant", name: "Connectify AI Companion", isAi: true })}
            className={`flex items-center gap-3 p-3.5 rounded-lg cursor-pointer hover:bg-white/5 transition border ${
              selectedGroup?._id === "ai-assistant"
                ? "bg-white/5 border-white/10"
                : "border-transparent bg-violet-600/5 hover:bg-violet-600/10"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center border border-white/10 shadow-inner">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold flex items-center gap-1.5 text-violet-300">
                Connectify AI Assistant
              </h4>
              <p className="text-xs text-gray-400 truncate">Ask me questions, translate text, or summarize chats.</p>
            </div>
          </div>
        )}
      </div>

      {/* --- POPUP MODAL: CREATE GROUP --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel border border-white/10 text-white rounded-xl shadow-2xl p-5 sm:p-6 animate-pop-in">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
              <h3 className="text-base font-semibold">Create New Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <img
                    src={groupAvatar || assets.avatar_icon}
                    alt="Group Avatar"
                    className="w-16 h-16 rounded-lg object-cover border border-white/10"
                  />
                  <label
                    htmlFor="group-avatar"
                    className="absolute inset-0 bg-black/40 text-[10px] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer rounded-lg transition"
                  >
                    Upload
                  </label>
                  <input
                    id="group-avatar"
                    type="file"
                    accept=".png, .jpg, .jpeg"
                    hidden
                    onChange={handleGroupAvatarUpload}
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Group Name"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500 transition text-white"
                  />
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Group Description (optional)"
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500 transition text-white resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold mb-2 block uppercase tracking-wider">
                  Select Members
                </label>
                <div className="max-h-[150px] overflow-y-auto border border-white/5 rounded-lg p-2 space-y-1 bg-black/10">
                  {users.map((u) => (
                    <div
                      key={u._id}
                      onClick={() => handleMemberSelect(u._id)}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition text-xs ${
                        selectedMembers.includes(u._id)
                          ? "bg-violet-600/20 text-white"
                          : "hover:bg-white/5 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={u.profilePic || assets.avatar_icon}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span>{u.fullName}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(u._id)}
                        onChange={() => {}} // Controlled by div click
                        className="accent-violet-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-lg cursor-pointer transition hover:scale-[1.01]"
              >
                Create Group
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- POPUP MODAL: JOIN GROUP VIA CODE --- */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel border border-white/10 text-white rounded-xl shadow-2xl p-5 sm:p-6 animate-pop-in">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
              <h3 className="text-base font-semibold">Join Group with Link Code</h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinGroupSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1 block">
                  Invite Link Code
                </label>
                <input
                  type="text"
                  required
                  value={inviteLink}
                  onChange={(e) => setInviteLink(e.target.value)}
                  placeholder="e.g. 5d8e78df7a"
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500 transition text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-lg cursor-pointer transition hover:scale-[1.01]"
              >
                Join Group
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SideBar;
