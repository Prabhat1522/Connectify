import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/util";
import { ChatContext } from "../../contex/ChatContext";
import { AuthContext } from "../../contex/AuthContex";
import toast from "react-hot-toast";
import {
  Send,
  Image as ImageIcon,
  Paperclip,
  Mic,
  Smile,
  Pin,
  Reply,
  Edit2,
  Trash2,
  X,
  Bot,
  User,
  Sparkles,
  Download,
  FileText,
  Loader,
  Globe,
  Plus,
} from "lucide-react";

const ChatContainer = () => {
  const {
    messages,
    selectedUser,
    selectedGroup,
    clearSelection,
    sendMessage,
    getMessages,
    getGroupMessages,
    reactToMessage,
    editMessage,
    deleteMessage,
    togglePinMessage,
    typingUsers,
    startTyping,
    stopTyping,
  } = useContext(ChatContext);

  const { authUser, onlineUsers, axios } = useContext(AuthContext);
  const scrollEnd = useRef();

  // Local Chat UI States
  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState(null); // msg object
  const [editingMsg, setEditingMsg] = useState(null); // msg object
  const [isDragOver, setIsDragOver] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [showEmojiPickerId, setShowEmojiPickerId] = useState(null);
  const [showTranslateId, setShowTranslateId] = useState(null);

  // Translations cache (messageId -> translatedText)
  const [translations, setTranslations] = useState({});
  const [translatingId, setTranslatingId] = useState(null);

  // Summarize state
  const [summary, setSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const recordingTimer = useRef(null);
  const audioChunks = useRef([]);

  // Smart suggestions
  const [smartReplies, setSmartReplies] = useState([]);
  const [fetchingReplies, setFetchingReplies] = useState(false);

  // AI Chat mode local state
  const [aiChatHistory, setAiChatHistory] = useState([
    {
      role: "assistant",
      content: "Hello! I am your Connectify AI Companion. How can I assist you today? I can help write templates, translate texts, or outline project milestones.",
    },
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  const isGroup = !!selectedGroup && !selectedGroup.isAi;
  const isAi = !!selectedGroup && selectedGroup.isAi;

  // React to change in selection (fetch messages)
  useEffect(() => {
    setReplyingTo(null);
    setEditingMsg(null);
    setInput("");
    setSmartReplies([]);
    setTranslations({});

    if (selectedUser) {
      getMessages(selectedUser._id);
    } else if (selectedGroup && !selectedGroup.isAi) {
      getGroupMessages(selectedGroup._id);
    }
  }, [selectedUser, selectedGroup]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollEnd.current) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, aiChatHistory, typingUsers]);

  // Handle Fetch Smart Replies Suggestions
  useEffect(() => {
    if (isAi || messages.length === 0) {
      setSmartReplies([]);
      return;
    }
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.senderId === authUser._id) {
      setSmartReplies([]);
      return;
    }

    const fetchReplies = async () => {
      setFetchingReplies(true);
      try {
        const { data } = await axios.post("/api/messages/ai/replies", {
          lastMessageText: lastMsg.text,
        });
        if (data.success) {
          setSmartReplies(data.data.suggestions);
        }
      } catch (error) {
        console.error("Failed to fetch smart replies:", error.message);
      }
      setFetchingReplies(false);
    };

    const delayDebounce = setTimeout(fetchReplies, 1000);
    return () => clearTimeout(delayDebounce);
  }, [messages]);

  // --- Voice Recorder Functions ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          await sendMessage({
            fileData: base64Audio,
            fileName: "VoiceNote.webm",
            fileType: "audio/webm",
          });
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimer.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      toast.error("Microphone access denied or error starting recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      clearInterval(recordingTimer.current);
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.onstop = null; // discard recording
      mediaRecorder.stop();
      clearInterval(recordingTimer.current);
      setIsRecording(false);
      toast("Voice note discarded.");
    }
  };

  // --- Send Message ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const textToSend = input.trim();
    if (!textToSend && !replyingTo) return;

    if (isAi) {
      setAiChatHistory((prev) => [...prev, { role: "user", content: textToSend }]);
      setInput("");
      setAiLoading(true);
      try {
        const history = aiChatHistory.map((h) => ({
          role: h.role,
          content: h.content,
        }));
        const { data } = await axios.post("/api/messages/ai/ask", {
          prompt: textToSend,
          chatHistory: history,
        });
        if (data.success) {
          setAiChatHistory((prev) => [
            ...prev,
            { role: "assistant", content: data.data.answer },
          ]);
        }
      } catch (err) {
        toast.error("AI Assistant request failed.");
      }
      setAiLoading(false);
      return;
    }

    if (editingMsg) {
      await editMessage(editingMsg._id, textToSend);
      setEditingMsg(null);
    } else {
      await sendMessage({
        text: textToSend,
        replyToId: replyingTo ? replyingTo._id : undefined,
      });
      setReplyingTo(null);
    }
    setInput("");
    stopTyping();
  };

  // --- Send Quick Smart Reply ---
  const handleSmartReplyClick = async (suggestion) => {
    await sendMessage({ text: suggestion });
    setSmartReplies([]);
  };

  // --- File uploads handlers ---
  const processUploadFile = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Data = reader.result;
      if (file.type.startsWith("image/")) {
        await sendMessage({ image: base64Data });
      } else {
        await sendMessage({
          fileData: base64Data,
          fileName: file.name,
          fileType: file.type,
        });
      }
    };
  };

  const handleSendImage = (e) => {
    processUploadFile(e.target.files[0]);
    e.target.value = "";
  };

  // --- Drag and Drop ---
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragOver(true);
    } else if (e.type === "dragleave") {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadFile(e.dataTransfer.files[0]);
    }
  };

  // --- AI Summarization ---
  const handleSummarizeChat = async () => {
    if (messages.length === 0) return;
    setSummarizing(true);
    try {
      const messagesSubset = messages.slice(-25).map((m) => ({
        senderName: m.senderId === authUser._id ? authUser.fullName : (selectedUser?.fullName || "Member"),
        text: m.text,
      }));

      const { data } = await axios.post("/api/messages/ai/summarize", {
        messages: messagesSubset,
      });
      if (data.success) {
        setSummary(data.data.summary);
      }
    } catch {
      toast.error("Failed to generate chat summary.");
    }
    setSummarizing(false);
  };

  // --- AI Message Translation ---
  const handleTranslate = async (messageId, text, lang) => {
    setTranslatingId(messageId);
    setShowTranslateId(null);
    try {
      const { data } = await axios.post("/api/messages/ai/translate", {
        text,
        targetLanguage: lang,
      });
      if (data.success) {
        setTranslations((prev) => ({ ...prev, [messageId]: data.data.translatedText }));
        toast.success(`Translated to ${lang}`);
      }
    } catch {
      toast.error("Translation request failed.");
    }
    setTranslatingId(null);
  };

  const activeTypingText = () => {
    const key = selectedGroup ? selectedGroup._id : selectedUser?._id;
    const name = typingUsers[key];
    if (name) {
      return `${name} is typing...`;
    }
    return null;
  };

  const pinnedMessage = messages.find((m) => m.pinned && !m.deleted);

  // Return Empty screen state if nothing is selected
  if (!selectedUser && !selectedGroup) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6 bg-black/10 select-none">
        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
          <Bot className="w-10 h-10 text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-wide">Connectify Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1 max-w-sm">
            Select a contact to chat directly, configure group channels, or play around with our AI companion chatbot.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className="flex flex-col relative h-full max-h-full overflow-hidden bg-black/5"
    >
      {/* Drag & drop overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-violet-600/10 backdrop-blur-md border-4 border-dashed border-violet-500 z-50 flex flex-col items-center justify-center pointer-events-none">
          <Paperclip className="w-12 h-12 text-violet-400 animate-bounce mb-3" />
          <h3 className="text-lg font-bold text-white">Drop attachment files here</h3>
          <p className="text-xs text-gray-300 mt-1">Images, PDFs, documents up to 8MB</p>
        </div>
      )}

      {/* ------- HEADER ------- */}
      <div className="flex items-center justify-between py-3.5 px-4 border-b border-white/5 bg-black/10">
        <div className="flex items-center gap-3">
          <img
            onClick={clearSelection}
            src={assets.arrow_icon}
            alt="Back"
            className="md:hidden w-6 cursor-pointer opacity-75 hover:opacity-100 transition"
          />
          <div className="relative">
            {isAi ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center border border-white/10">
                <Bot className="w-5 h-5 text-white" />
              </div>
            ) : (
              <img
                src={(selectedUser?.profilePic || selectedGroup?.avatar) || assets.avatar_icon}
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-white/10"
              />
            )}
            {!isAi && !isGroup && onlineUsers.includes(selectedUser?._id) && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-[#161224] pulse-green"></span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide">
              {isAi ? "Connectify AI Companion" : (selectedUser?.fullName || selectedGroup?.name)}
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {isAi ? "Live AI generation" : isGroup ? `${selectedGroup.members?.length} members` : (onlineUsers.includes(selectedUser?._id) ? "Online" : "Offline")}
            </p>
          </div>
        </div>

        {/* AI Action helpers */}
        {!isAi && messages.length > 0 && (
          <button
            onClick={handleSummarizeChat}
            disabled={summarizing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/20 rounded-full text-xs font-semibold text-violet-300 transition cursor-pointer disabled:opacity-50"
          >
            {summarizing ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Summarize Topic
          </button>
        )}
      </div>

      {/* ------- PINNED BANNER ------- */}
      {pinnedMessage && (
        <div className="bg-violet-600/10 border-b border-violet-500/10 py-2.5 px-4 flex items-center justify-between text-xs text-violet-300 animate-slide-up">
          <div className="flex items-center gap-2 truncate">
            <Pin className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold uppercase tracking-wider text-[9px] bg-violet-500/20 px-1.5 py-0.5 rounded">Pinned</span>
            <span className="truncate">{pinnedMessage.text || "[Media attachment]"}</span>
          </div>
          <button
            onClick={() => togglePinMessage(pinnedMessage._id)}
            className="text-[10px] font-semibold text-gray-400 hover:text-white transition cursor-pointer"
          >
            Unpin
          </button>
        </div>
      )}

      {/* ------- CHAT AREA STREAM ------- */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {isAi ? (
          // AI Chat streams
          aiChatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 max-w-[85%] ${
                msg.role === "user" ? "ml-auto flex-row-reverse" : ""
              } animate-pop-in`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                  msg.role === "user"
                    ? "bg-violet-600/20 border-violet-500/20"
                    : "bg-gradient-to-tr from-violet-500 to-indigo-600 border-white/10"
                }`}
              >
                {msg.role === "user" ? <User className="w-4 h-4 text-violet-300" /> : <Bot className="w-4.5 h-4.5 text-white" />}
              </div>
              <div
                className={`p-3 rounded-xl text-sm leading-relaxed border ${
                  msg.role === "user"
                    ? "bg-violet-600/25 border-violet-500/25 text-white rounded-tr-none"
                    : "bg-white/5 border-white/5 text-gray-100 rounded-tl-none shadow-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        ) : (
          // Direct / Group database streams
          messages.map((msg) => {
            const isSelf = msg.senderId === authUser._id;
            const hasReactions = msg.reactions && msg.reactions.length > 0;
            const isMsgHovered = hoveredMessageId === msg._id;
            const isTranslated = !!translations[msg._id];

            return (
              <div
                key={msg._id}
                onMouseEnter={() => setHoveredMessageId(msg._id)}
                onMouseLeave={() => {
                  setHoveredMessageId(null);
                  setShowEmojiPickerId(null);
                  setShowTranslateId(null);
                }}
                className={`flex gap-2.5 items-end max-w-[80%] relative group ${
                  isSelf ? "ml-auto flex-row" : "flex-row-reverse"
                }`}
              >
                {/* Message Avatar (other members in groups) */}
                {isGroup && !isSelf && (
                  <img
                    src={msg.senderId?.profilePic || assets.avatar_icon}
                    alt=""
                    title={msg.senderId?.fullName}
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/10 mb-5"
                  />
                )}

                {/* Main bubble body */}
                <div className="flex flex-col gap-1 relative">
                  {/* Sender Name in group */}
                  {isGroup && !isSelf && (
                    <span className="text-[10px] text-violet-400 font-semibold px-1">
                      {msg.senderId?.fullName}
                    </span>
                  )}

                  {/* Reply Reference Preview Card */}
                  {msg.replyTo && (
                    <div className="bg-black/20 border-l-2 border-violet-500 p-2 rounded-t-lg text-xs opacity-75 max-w-full truncate text-violet-300">
                      <p className="font-semibold text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Replying to message</p>
                      {msg.replyTo.text || "[Media attachment]"}
                    </div>
                  )}

                  {/* Dynamic reaction hover bar */}
                  {isMsgHovered && !msg.deleted && (
                    <div
                      className={`absolute -top-8 z-30 flex items-center gap-1.5 bg-black/80 border border-white/10 px-2 py-1 rounded-full shadow-xl backdrop-blur-md animate-pop-in ${
                        isSelf ? "right-0" : "left-0"
                      }`}
                    >
                      {/* Emoji pills */}
                      {["❤️", "😂", "🔥", "😮", "😢", "👍"].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => reactToMessage(msg._id, emoji)}
                          className="hover:scale-125 transition text-sm cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}

                      <div className="h-3 w-[1px] bg-white/10 mx-1"></div>

                      {/* Translation dropdown selector */}
                      <div className="relative">
                        <button
                          onClick={() => setShowTranslateId(showTranslateId === msg._id ? null : msg._id)}
                          className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white cursor-pointer"
                          title="Translate text"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </button>
                        {showTranslateId === msg._id && (
                          <div className="absolute top-6 right-0 z-40 bg-[#1e1a30] border border-white/10 rounded-lg p-1.5 shadow-2xl flex flex-col gap-1 w-24 text-[10px]">
                            {["Spanish", "French", "German", "Hindi"].map((lang) => (
                              <button
                                key={lang}
                                onClick={() => handleTranslate(msg._id, msg.text, lang)}
                                className="px-2 py-1 hover:bg-white/5 rounded text-left transition cursor-pointer"
                              >
                                {lang}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* General options */}
                      <button
                        onClick={() => setReplyingTo(msg)}
                        className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white cursor-pointer"
                        title="Reply to message"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => togglePinMessage(msg._id)}
                        className={`p-1 hover:bg-white/10 rounded cursor-pointer ${msg.pinned ? "text-violet-400" : "text-gray-400 hover:text-white"}`}
                        title="Pin message"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      {isSelf && (
                        <>
                          <button
                            onClick={() => {
                              setEditingMsg(msg);
                              setInput(msg.text || "");
                            }}
                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white cursor-pointer"
                            title="Edit message"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteMessage(msg._id)}
                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-red-400 cursor-pointer"
                            title="Delete message for everyone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Core bubble wrapper */}
                  <div
                    className={`p-3 rounded-2xl relative border shadow-sm max-w-sm ${
                      isSelf
                        ? "bg-violet-600/20 border-violet-500/20 text-white rounded-br-none"
                        : "bg-white/5 border-white/5 text-gray-100 rounded-bl-none"
                    } ${msg.deleted ? "italic text-gray-500 text-xs" : ""}`}
                  >
                    {/* Media Attachments */}
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Image attachment"
                        className="max-w-xs rounded-lg overflow-hidden border border-white/5 mb-2 hover:scale-[1.01] transition duration-200"
                      />
                    )}

                    {/* PDF/General Files cards */}
                    {msg.fileUrl && (
                      <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-center gap-3.5 mb-2 max-w-xs">
                        <div className="w-10 h-10 bg-violet-600/20 border border-violet-500/25 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-xs font-semibold truncate text-gray-200">{msg.fileName || "File Attachment"}</p>
                          <p className="text-[10px] text-gray-400 truncate uppercase mt-0.5">{msg.fileType?.split("/")[1] || "document"}</p>
                        </div>
                        <button
                          onClick={() => window.open(msg.fileUrl)}
                          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white cursor-pointer transition shrink-0"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Render Text message */}
                    {msg.text && <p className="text-sm break-words">{msg.text}</p>}

                    {/* Show Translation below text */}
                    {isTranslated && (
                      <div className="mt-2 pt-1.5 border-t border-white/5 text-xs text-violet-300/90 leading-relaxed italic text-left">
                        <Globe className="w-3 h-3 inline mr-1" /> {translations[msg._id]}
                      </div>
                    )}

                    {translatingId === msg._id && (
                      <div className="mt-1.5 text-[10px] text-gray-400 italic flex items-center gap-1.5">
                        <Loader className="w-3 h-3 animate-spin" /> Translating...
                      </div>
                    )}

                    {/* Status/Pin markers */}
                    <div className="flex items-center justify-end gap-1.5 mt-2.5 text-[9px] text-gray-400 select-none">
                      {msg.edited && <span className="text-[8px] bg-white/5 px-1 py-0.2 rounded">edited</span>}
                      {msg.pinned && <Pin className="w-2.5 h-2.5 text-violet-400 shrink-0" />}
                      <span>{formatMessageTime(msg.createdAt)}</span>
                    </div>
                  </div>

                  {/* Reaction pills below bubble */}
                  {hasReactions && (
                    <div
                      className={`flex gap-1 mt-1 flex-wrap ${
                        isSelf ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.reactions.map((react, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-white/5 border border-white/5 rounded-full px-1.5 py-0.5 flex items-center gap-1 shadow-sm select-none"
                          title="Click to remove or toggle"
                          onClick={() => reactToMessage(msg._id, react.emoji)}
                        >
                          {react.emoji}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Avatar bubble info */}
                <div className="text-center text-[10px] text-gray-500 shrink-0 mb-1">
                  <img
                    src={isSelf ? authUser?.profilePic || assets.avatar_icon : (selectedUser?.profilePic || assets.avatar_icon)}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover border border-white/5"
                  />
                </div>
              </div>
            );
          })
        )}

        {/* Real-time typing text display */}
        {activeTypingText() && (
          <div className="flex items-center gap-2 text-xs text-violet-300 italic p-1 animate-pulse">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full inline-block pulse-green" />
            {activeTypingText()}
          </div>
        )}

        {aiLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-400 italic p-1 animate-pulse">
            <Loader className="w-3.5 h-3.5 animate-spin" /> AI Companion is thinking...
          </div>
        )}

        <div ref={scrollEnd}></div>
      </div>

      {/* ------- SUMMARY MODAL POPUP ------- */}
      {summary && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel border border-white/10 text-white rounded-xl shadow-2xl p-5 sm:p-6 animate-pop-in">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" /> AI Topic Summary
              </h3>
              <button onClick={() => setSummary(null)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-gray-300 leading-relaxed bg-black/10 border border-white/5 rounded-lg p-3.5 whitespace-pre-line max-h-[300px] overflow-y-auto">
              {summary}
            </div>
            <button
              onClick={() => setSummary(null)}
              className="mt-4 w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ------- SMART REPLY PILLS SUGGESTIONS ------- */}
      {smartReplies.length > 0 && !isAi && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto select-none bg-black/5 border-t border-white/5">
          {smartReplies.map((reply, index) => (
            <button
              key={index}
              onClick={() => handleSmartReplyClick(reply)}
              className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-violet-500/20 text-xs font-medium text-gray-300 hover:text-white rounded-full transition cursor-pointer shrink-0"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* ------- REPLY / EDIT INDICATOR PREVIEW ------- */}
      {(replyingTo || editingMsg) && (
        <div className="px-4 py-2 bg-[#201c30] border-t border-white/5 flex items-center justify-between text-xs animate-slide-up text-violet-300 select-none">
          <div className="flex items-center gap-1.5 truncate">
            {replyingTo ? <Reply className="w-3.5 h-3.5 text-violet-400" /> : <Edit2 className="w-3.5 h-3.5 text-violet-400" />}
            <span className="font-semibold">
              {replyingTo ? "Replying to:" : "Editing Message:"}
            </span>
            <span className="truncate text-gray-400">
              {replyingTo ? replyingTo.text || "[Attachment file]" : editingMsg.text}
            </span>
          </div>
          <button
            onClick={() => {
              setReplyingTo(null);
              setEditingMsg(null);
              setInput("");
            }}
            className="p-1 hover:bg-white/10 rounded cursor-pointer text-gray-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ------- INPUT PANEL ZONE ------- */}
      <div className="p-3 bg-black/10 border-t border-white/5 flex items-center gap-3">
        {/* Attachment menu */}
        {!isRecording && !isAi && (
          <div className="flex items-center">
            <input
              type="file"
              id="chat-file"
              onChange={handleSendImage}
              accept="image/*, application/pdf, .txt, .zip, .doc, .docx"
              hidden
            />
            <label
              htmlFor="chat-file"
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full cursor-pointer text-gray-400 hover:text-white transition flex items-center justify-center hover:scale-105"
              title="Upload file or photo"
            >
              <Paperclip className="w-4 h-4" />
            </label>
          </div>
        )}

        {/* Input box / recording bar */}
        <div className="flex-1 flex items-center bg-white/5 border border-white/5 rounded-full px-3.5 py-1 min-h-[44px]">
          {isRecording ? (
            <div className="flex-1 flex items-center justify-between text-xs select-none">
              <span className="text-red-400 font-semibold flex items-center gap-1.5 animate-pulse">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block"></span>
                Recording Voice Note... ({recordingSeconds}s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelRecording}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={stopRecording}
                  className="px-3.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition cursor-pointer font-semibold"
                >
                  Send Note
                </button>
              </div>
            </div>
          ) : (
            <>
              <input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (e.target.value.trim() !== "") {
                    startTyping();
                  } else {
                    stopTyping();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage(e);
                }}
                type="text"
                className="flex-1 text-sm border-none outline-none text-white bg-transparent py-2.5 placeholder-gray-400"
                placeholder={isAi ? "Message AI Assistant..." : "Write message text..."}
              />

              {/* Quick voice recorder activate */}
              {!input && !isAi && (
                <button
                  onClick={startRecording}
                  className="p-1 text-gray-400 hover:text-white hover:scale-110 transition cursor-pointer"
                  title="Record voice note"
                >
                  <Mic className="w-4.5 h-4.5" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Send message button */}
        {!isRecording && (
          <button
            onClick={handleSendMessage}
            disabled={!input.trim()}
            className="p-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-full cursor-pointer transition shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatContainer;
