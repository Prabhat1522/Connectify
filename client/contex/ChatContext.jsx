import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContex";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState({}); // { [userId/groupId]: userName }
  const { socket, axios, authUser } = useContext(AuthContext);

  // Fetch users for sidebar
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.data.users);
        setUnseenMessages(data.data.unseenMessages);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Fetch groups list
  const getGroups = async () => {
    try {
      const { data } = await axios.get("/api/groups/list");
      if (data.success) {
        setGroups(data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Create a new group
  const createNewGroup = async (groupData) => {
    try {
      const { data } = await axios.post("/api/groups/create", groupData);
      if (data.success) {
        setGroups((prev) => [data.data, ...prev]);
        toast.success("Group created successfully!");
        if (socket) {
          socket.emit("joinGroup", data.data._id);
        }
        return data.data;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    return null;
  };

  // Join a group via invite
  const joinGroup = async (inviteLink) => {
    try {
      const { data } = await axios.post("/api/groups/join", { inviteLink });
      if (data.success) {
        setGroups((prev) => [data.data, ...prev]);
        toast.success("Joined group successfully!");
        if (socket) {
          socket.emit("joinGroup", data.data._id);
        }
        return data.data;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    return null;
  };

  // Get messages for direct user
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Get group messages
  const getGroupMessages = async (groupId) => {
    try {
      const { data } = await axios.get(`/api/messages/group/${groupId}`);
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Send message (direct or group)
  const sendMessage = async (messagePayload) => {
    try {
      const isGroup = !!selectedGroup;
      const targetId = isGroup ? selectedGroup._id : selectedUser._id;
      const { data } = await axios.post(`/api/messages/send/${targetId}`, {
        ...messagePayload,
        isGroup,
      });

      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // React to a message
  const reactToMessage = async (messageId, emoji) => {
    try {
      const isGroup = !!selectedGroup;
      const targetId = isGroup ? selectedGroup._id : selectedUser._id;
      const { data } = await axios.post(`/api/messages/react/${messageId}`, {
        emoji,
        targetId,
        isGroup,
      });
      if (data.success) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === messageId ? data.data : msg))
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Edit a message
  const editMessage = async (messageId, newText) => {
    try {
      const isGroup = !!selectedGroup;
      const targetId = isGroup ? selectedGroup._id : selectedUser._id;
      const { data } = await axios.post(`/api/messages/edit/${messageId}`, {
        text: newText,
        targetId,
        isGroup,
      });
      if (data.success) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === messageId ? data.data : msg))
        );
        toast.success("Message edited.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Delete a message (for everyone)
  const deleteMessage = async (messageId) => {
    try {
      const isGroup = !!selectedGroup;
      const targetId = isGroup ? selectedGroup._id : selectedUser._id;
      const { data } = await axios.post(`/api/messages/delete/${messageId}`, {
        targetId,
        isGroup,
      });
      if (data.success) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === messageId ? data.data : msg))
        );
        toast.success("Message deleted.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Toggle pin a message
  const togglePinMessage = async (messageId) => {
    try {
      const isGroup = !!selectedGroup;
      const targetId = isGroup ? selectedGroup._id : selectedUser._id;
      const { data } = await axios.post(`/api/messages/pin/${messageId}`, {
        targetId,
        isGroup,
      });
      if (data.success) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === messageId ? data.data : msg))
        );
        toast.success(data.data.pinned ? "Message pinned." : "Message unpinned.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Broadcast typing status
  const startTyping = () => {
    if (!socket) return;
    const isGroup = !!selectedGroup;
    const targetId = isGroup ? selectedGroup._id : selectedUser._id;
    socket.emit("typing", {
      senderId: authUser._id,
      senderName: authUser.fullName,
      receiverId: isGroup ? null : targetId,
      groupId: isGroup ? targetId : null,
    });
  };

  const stopTyping = () => {
    if (!socket) return;
    const isGroup = !!selectedGroup;
    const targetId = isGroup ? selectedGroup._id : selectedUser._id;
    socket.emit("stopTyping", {
      senderId: authUser._id,
      receiverId: isGroup ? null : targetId,
      groupId: isGroup ? targetId : null,
    });
  };

  // Setup Socket listeners for real-time messages
  const subscribeToSocketEvents = () => {
    if (!socket) return;

    // Listen for new messages
    socket.on("newMessage", (newMessage) => {
      const isGroupMessage = !!newMessage.groupId;
      
      if (isGroupMessage) {
        if (selectedGroup && selectedGroup._id === newMessage.groupId) {
          setMessages((prev) => [...prev, newMessage]);
        }
        // Increment unseen group messages (could map locally if wanted)
      } else {
        if (selectedUser && selectedUser._id === newMessage.senderId) {
          newMessage.seen = true;
          setMessages((prev) => [...prev, newMessage]);
          axios.put(`/api/messages/mark/${newMessage._id}`).catch((e) => {});
        } else {
          setUnseenMessages((prev) => ({
            ...prev,
            [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
          }));
        }
      }
    });

    // Listen for typing indicators
    socket.on("typing", (data) => {
      const key = data.groupId || data.senderId;
      setTypingUsers((prev) => ({
        ...prev,
        [key]: data.senderName,
      }));
    });

    socket.on("stopTyping", (data) => {
      const key = data.groupId || data.senderId;
      setTypingUsers((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    });

    // Listen for message reactions
    socket.on("messageReaction", (data) => {
      // data: { messageId, reactions }
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId ? { ...msg, reactions: data.reactions } : msg
        )
      );
    });

    // Listen for message edits
    socket.on("messageEdit", (data) => {
      // data: { messageId, text, edited }
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId ? { ...msg, text: data.text, edited: data.edited } : msg
        )
      );
    });

    // Listen for message deletions
    socket.on("messageDelete", (data) => {
      // data: { messageId, text, deleted }
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? {
                ...msg,
                text: data.text,
                image: undefined,
                fileUrl: undefined,
                fileName: undefined,
                fileType: undefined,
                deleted: data.deleted,
              }
            : msg
        )
      );
    });

    // Listen for message pins
    socket.on("messagePin", (data) => {
      // data: { messageId, pinned }
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId ? { ...msg, pinned: data.pinned } : msg
        )
      );
    });

    // Listen for group deletion
    socket.on("groupDeleted", (data) => {
      // data: { groupId }
      setGroups((prev) => prev.filter((g) => g._id !== data.groupId));
      if (selectedGroup && selectedGroup._id === data.groupId) {
        setSelectedGroup(null);
        toast.error("This group has been deleted by the administrator.");
      }
    });
  };

  const unsubscribeFromSocketEvents = () => {
    if (!socket) return;
    socket.off("newMessage");
    socket.off("typing");
    socket.off("stopTyping");
    socket.off("messageReaction");
    socket.off("messageEdit");
    socket.off("messageDelete");
    socket.off("messagePin");
    socket.off("groupDeleted");
  };

  // Join rooms when group list changes or groups load
  useEffect(() => {
    if (socket && groups.length > 0) {
      groups.forEach((group) => {
        socket.emit("joinGroup", group._id);
      });
    }
  }, [socket, groups]);

  // Subscribe to socket message/status updates
  useEffect(() => {
    subscribeToSocketEvents();
    return () => unsubscribeFromSocketEvents();
  }, [socket, selectedUser, selectedGroup]);

  const selectUserChat = (user) => {
    setSelectedGroup(null);
    setSelectedUser(user);
    setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
  };

  const selectGroupChat = (group) => {
    setSelectedUser(null);
    setSelectedGroup(group);
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setSelectedGroup(null);
  };

  const deleteGroup = async (groupId) => {
    try {
      const { data } = await axios.delete(`/api/groups/delete/${groupId}`);
      if (data.success) {
        setGroups((prev) => prev.filter((g) => g._id !== groupId));
        if (selectedGroup && selectedGroup._id === groupId) {
          setSelectedGroup(null);
        }
        toast.success("Group deleted successfully!");
        return true;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    return false;
  };

  const value = {
    messages,
    users,
    groups,
    selectedUser,
    selectedGroup,
    unseenMessages,
    typingUsers,
    getUsers,
    getGroups,
    createNewGroup,
    joinGroup,
    getMessages,
    getGroupMessages,
    sendMessage,
    reactToMessage,
    editMessage,
    deleteMessage,
    togglePinMessage,
    startTyping,
    stopTyping,
    selectUserChat,
    selectGroupChat,
    clearSelection,
    deleteGroup,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};