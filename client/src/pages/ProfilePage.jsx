import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../../contex/AuthContex";
import { ArrowLeft, Camera, Palette, User, MessageCircle, RefreshCw } from "lucide-react";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);
  const [selectedImg, setSelectedImg] = useState(null);
  const [name, setName] = useState(authUser?.fullName || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const [customStatus, setCustomStatus] = useState(authUser?.customStatus || "");
  const [themePref, setThemePref] = useState(authUser?.themePreference || "dark");
  const [accentColor, setAccentColor] = useState(authUser?.accentColor || "#8b5cf6");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const colorPresets = [
    { name: "Violet", value: "#8b5cf6" },
    { name: "Emerald", value: "#10b981" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Rose", value: "#f43f5e" },
    { name: "Amber", value: "#f59e0b" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      fullName: name,
      bio,
      customStatus,
      themePreference: themePref,
      accentColor,
    };

    if (selectedImg) {
      const reader = new FileReader();
      reader.readAsDataURL(selectedImg);
      reader.onload = async () => {
        payload.profilePic = reader.result;
        await updateProfile(payload);
        setSaving(false);
        navigate("/");
      };
    } else {
      await updateProfile(payload);
      setSaving(false);
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-y-auto">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-3xl glass-panel text-white border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8 animate-pop-in">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Chats
          </button>
          <h2 className="text-xl font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300">
            Account Customization
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1.2fr_1.8fr] gap-8">
          
          {/* Left Column: Avatar upload + Theme preferences */}
          <div className="flex flex-col items-center gap-6 border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-8">
            <div className="relative group">
              <img
                src={selectedImg ? URL.createObjectURL(selectedImg) : authUser?.profilePic || assets.avatar_icon}
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-white/10 group-hover:opacity-85 transition"
              />
              <label
                htmlFor="avatar"
                className="absolute bottom-0 right-0 p-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-full cursor-pointer shadow-lg hover:scale-105 transition"
              >
                <Camera className="w-4 h-4" />
                <input
                  onChange={(e) => setSelectedImg(e.target.files[0])}
                  type="file"
                  id="avatar"
                  accept=".png, .jpg, .jpeg"
                  hidden
                />
              </label>
            </div>
            
            <div className="text-center">
              <h3 className="font-medium text-lg">{authUser?.fullName}</h3>
              <p className="text-xs text-gray-400 mt-1">{authUser?.email}</p>
            </div>

            {/* Quick Themes Preference */}
            <div className="w-full mt-2">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-1 mb-2 uppercase tracking-wider">
                <Palette className="w-3.5 h-3.5" /> Display Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["dark", "light", "glass"].map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => setThemePref(theme)}
                    className={`py-2 text-xs rounded-lg border capitalize transition cursor-pointer ${
                      themePref === theme
                        ? "border-violet-500 bg-violet-600/20 text-white"
                        : "border-white/5 bg-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent color preset selection */}
            <div className="w-full">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-1 mb-2 uppercase tracking-wider">
                <Palette className="w-3.5 h-3.5" /> Accent Color
              </label>
              <div className="flex gap-2.5 justify-center flex-wrap">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setAccentColor(preset.value)}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                    className={`w-7 h-7 rounded-full border-2 transition cursor-pointer hover:scale-110 ${
                      accentColor === preset.value ? "border-white scale-105" : "border-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Personal details form */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                <User className="w-3.5 h-3.5" /> Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter display name"
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                <MessageCircle className="w-3.5 h-3.5" /> Custom Status message
              </label>
              <input
                type="text"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                About / Bio
              </label>
              <textarea
                required
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief bio about yourself..."
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition text-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-4 w-full py-3 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-lg font-medium cursor-pointer shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
