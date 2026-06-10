import React, { useState, useRef, useEffect } from "react";
import { Search, Clock } from "lucide-react";

const EmojiPicker = ({ isOpen, onClose, onEmojiSelect, buttonRef }) => {
  const [activeCategory, setActiveCategory] = useState("smileys");
  const [searchTerm, setSearchTerm] = useState("");
  const [recentEmojis, setRecentEmojis] = useState([]);
  const pickerRef = useRef(null);

  // Load recent emojis from localStorage
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem("recentEmojis") || "[]");
    setRecentEmojis(recent.slice(0, 24));
  }, []);

  // Handle clicks outside picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, buttonRef]);

  // Emoji categories with popular emojis
  const emojiCategories = {
    recent: {
      name: "Recent",
      icon: "🕒",
      emojis: recentEmojis,
    },
    smileys: {
      name: "Smileys & People",
      icon: "😀",
      emojis: [
        "😀",
        "😃",
        "😄",
        "😁",
        "😆",
        "😅",
        "🤣",
        "😂",
        "🙂",
        "🙃",
        "😉",
        "😊",
        "😇",
        "🥰",
        "😍",
        "🤩",
        "😘",
        "😗",
        "😚",
        "😙",
        "😋",
        "😛",
        "😜",
        "🤪",
        "😝",
        "🤑",
        "🤗",
        "🤭",
        "🤫",
        "🤔",
        "🤐",
        "🤨",
        "😐",
        "😑",
        "😶",
        "😏",
        "😒",
        "🙄",
        "😬",
        "🤥",
        "😔",
        "😪",
        "🤤",
        "😴",
        "😷",
        "🤒",
        "🤕",
        "🤢",
        "🤮",
        "🤧",
        "🥶",
        "🥵",
        "😵",
        "🤯",
        "🤠",
        "🥳",
        "😎",
        "🤓",
        "🧐",
        "😕",
        "😟",
        "🙁",
        "😮",
        "😯",
        "😲",
        "😳",
        "🥺",
        "😦",
        "😧",
        "😨",
        "😰",
        "😥",
        "😢",
        "😭",
        "😱",
        "😖",
        "😣",
        "😞",
        "😓",
        "😩",
        "😫",
        "🥱",
        "😤",
        "😡",
        "😠",
        "🤬",
        "😈",
        "👿",
        "💀",
        "💩",
        "🤡",
        "👹",
        "👺",
        "👻",
        "👽",
        "👾",
        "🤖",
        "🎭",
      ],
    },
    animals: {
      name: "Animals & Nature",
      icon: "🐶",
      emojis: [
        "🐶",
        "🐱",
        "🐭",
        "🐹",
        "🐰",
        "🦊",
        "🐻",
        "🐼",
        "🐨",
        "🐯",
        "🦁",
        "🐮",
        "🐷",
        "🐽",
        "🐸",
        "🐵",
        "🙈",
        "🙉",
        "🙊",
        "🐒",
        "🐔",
        "🐧",
        "🐦",
        "🐤",
        "🐣",
        "🐥",
        "🦆",
        "🦅",
        "🦉",
        "🦇",
        "🐺",
        "🐗",
        "🐴",
        "🦄",
        "🐝",
        "🐛",
        "🦋",
        "🐌",
        "🐞",
        "🐜",
        "🦟",
        "🦗",
        "🕷️",
        "🕸️",
        "🦂",
        "🐢",
        "🐍",
        "🦎",
        "🦖",
        "🦕",
        "🐙",
        "🦑",
        "🦐",
        "🦞",
        "🦀",
        "🐡",
        "🐠",
        "🐟",
        "🐬",
        "🐳",
        "🐋",
        "🦈",
        "🐊",
        "🐅",
        "🐆",
        "🦓",
        "🦍",
        "🦧",
        "🐘",
        "🦛",
        "🦏",
        "🐪",
        "🐫",
        "🦒",
        "🦘",
        "🐃",
        "🐂",
        "🐄",
        "🐎",
        "🐖",
      ],
    },
    food: {
      name: "Food & Drink",
      icon: "🍕",
      emojis: [
        "🍏",
        "🍎",
        "🍐",
        "🍊",
        "🍋",
        "🍌",
        "🍉",
        "🍇",
        "🍓",
        "🫐",
        "🍈",
        "🍒",
        "🍑",
        "🥭",
        "🍍",
        "🥥",
        "🥝",
        "🍅",
        "🍆",
        "🥑",
        "🥦",
        "🥬",
        "🥒",
        "🌶️",
        "🫑",
        "🌽",
        "🥕",
        "🫒",
        "🧄",
        "🧅",
        "🥔",
        "🍠",
        "🥐",
        "🥯",
        "🍞",
        "🥖",
        "🥨",
        "🧀",
        "🥚",
        "🍳",
        "🧈",
        "🥞",
        "🧇",
        "🥓",
        "🥩",
        "🍗",
        "🍖",
        "🦴",
        "🌭",
        "🍔",
        "🍟",
        "🍕",
        "🫓",
        "🥪",
        "🥙",
        "🧆",
        "🌮",
        "🌯",
        "🫔",
        "🥗",
        "🥘",
        "🫕",
        "🍝",
        "🍜",
        "🍲",
        "🍛",
        "🍣",
        "🍱",
        "🥟",
        "🦪",
        "🍤",
        "🍙",
        "🍚",
        "🍘",
        "🍥",
        "🥠",
        "🥮",
        "🍢",
        "🍡",
        "🍧",
      ],
    },
    activities: {
      name: "Activities",
      icon: "⚽",
      emojis: [
        "⚽",
        "🏀",
        "🏈",
        "⚾",
        "🥎",
        "🎾",
        "🏐",
        "🏉",
        "🥏",
        "🎱",
        "🪀",
        "🏓",
        "🏸",
        "🏒",
        "🏑",
        "🥍",
        "🏏",
        "🪃",
        "🥅",
        "⛳",
        "🪁",
        "🏹",
        "🎣",
        "🤿",
        "🥊",
        "🥋",
        "🎽",
        "🛹",
        "🛷",
        "⛸️",
        "🥌",
        "🎿",
        "⛷️",
        "🏂",
        "🪂",
        "🏋️",
        "🤼",
        "🤸",
        "⛹️",
        "🤺",
        "🏌️",
        "🏇",
        "🧘",
        "🏄",
        "🏊",
        "🤽",
        "🚣",
        "🧗",
        "🚵",
        "🚴",
        "🏆",
        "🥇",
        "🥈",
        "🥉",
        "🏅",
        "🎖️",
        "🏵️",
        "🎗️",
        "🎫",
        "🎟️",
        "🎪",
        "🤹",
        "🎭",
        "🩰",
        "🎨",
        "🎬",
        "🎤",
        "🎧",
        "🎼",
        "🎵",
        "🎶",
        "🥽",
        "🥼",
        "🦺",
        "👑",
        "🎩",
        "🎓",
        "🧢",
        "🪖",
        "⛑️",
      ],
    },
    objects: {
      name: "Objects",
      icon: "💎",
      emojis: [
        "⌚",
        "📱",
        "📲",
        "💻",
        "⌨️",
        "🖥️",
        "🖨️",
        "🖱️",
        "🖲️",
        "🕹️",
        "🗜️",
        "💽",
        "💾",
        "💿",
        "📀",
        "📼",
        "📷",
        "📸",
        "📹",
        "🎥",
        "📽️",
        "🎞️",
        "📞",
        "☎️",
        "📟",
        "📠",
        "📺",
        "📻",
        "🎙️",
        "🎚️",
        "🎛️",
        "🧭",
        "⏱️",
        "⏲️",
        "⏰",
        "🕰️",
        "⌛",
        "⏳",
        "📡",
        "🔋",
        "🔌",
        "💡",
        "🔦",
        "🕯️",
        "🪔",
        "🧯",
        "🛢️",
        "💸",
        "💵",
        "💴",
        "💶",
        "💷",
        "💰",
        "💳",
        "💎",
        "⚖️",
        "🧰",
        "🔧",
        "🔨",
        "⚒️",
        "🛠️",
        "⛏️",
        "🔩",
        "⚙️",
        "🧱",
        "⛓️",
        "🧲",
        "🔫",
        "💣",
        "🧨",
        "🪓",
        "🔪",
        "🗡️",
        "⚔️",
        "🛡️",
        "🚬",
        "⚰️",
        "🪦",
        "⚱️",
        "🏺",
      ],
    },
    symbols: {
      name: "Symbols",
      icon: "❤️",
      emojis: [
        "❤️",
        "🧡",
        "💛",
        "💚",
        "💙",
        "💜",
        "🖤",
        "🤍",
        "🤎",
        "💔",
        "❣️",
        "💕",
        "💞",
        "💓",
        "💗",
        "💖",
        "💘",
        "💝",
        "💟",
        "☮️",
        "✝️",
        "☪️",
        "🕉️",
        "☸️",
        "✡️",
        "🔯",
        "🕎",
        "☯️",
        "☦️",
        "🛐",
        "⛎",
        "♈",
        "♉",
        "♊",
        "♋",
        "♌",
        "♍",
        "♎",
        "♏",
        "♐",
        "♑",
        "♒",
        "♓",
        "🆔",
        "⚛️",
        "🉑",
        "☢️",
        "☣️",
        "📴",
        "📳",
        "🈶",
        "🈚",
        "🈸",
        "🈺",
        "🈷️",
        "✴️",
        "🆚",
        "💮",
        "🉐",
        "㊙️",
        "㊗️",
        "🈴",
        "🈵",
        "🈹",
        "🈲",
        "🅰️",
        "🅱️",
        "🆎",
        "🆑",
        "🅾️",
        "🆘",
        "❌",
        "⭕",
        "🛑",
        "⛔",
        "📛",
        "🚫",
        "💯",
        "💢",
        "♨️",
      ],
    },
  };

  const handleEmojiClick = (emoji) => {
    // Add to recent emojis
    const recent = JSON.parse(localStorage.getItem("recentEmojis") || "[]");
    const updatedRecent = [emoji, ...recent.filter((e) => e !== emoji)].slice(
      0,
      24
    );
    localStorage.setItem("recentEmojis", JSON.stringify(updatedRecent));
    setRecentEmojis(updatedRecent);

    // Send emoji to parent
    onEmojiSelect(emoji);
    onClose();
  };

  const filteredEmojis = () => {
    if (!searchTerm) return emojiCategories[activeCategory]?.emojis || [];

    const allEmojis = Object.values(emojiCategories).flatMap(
      (cat) => cat.emojis
    );
    return allEmojis.filter((emoji) => {
      // Simple search - you could enhance this with emoji names/keywords
      return emoji.includes(searchTerm);
    });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full right-0 mb-2 w-80 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg z-50"
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search emojis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Category Tabs */}
      {!searchTerm && (
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {Object.entries(emojiCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex-shrink-0 px-3 py-2 text-lg hover:bg-gray-50 transition-colors ${
                activeCategory === key
                  ? "bg-blue-50 border-b-2 border-blue-500"
                  : ""
              }`}
              title={category.name}
            >
              {key === "recent" ? <Clock className="h-4 w-4" /> : category.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="p-3">
        {searchTerm && (
          <div className="mb-2">
            <h3 className="text-sm font-medium text-gray-700">
              Search Results
            </h3>
          </div>
        )}

        {!searchTerm &&
          activeCategory === "recent" &&
          recentEmojis.length === 0 && (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recently used emojis</p>
            </div>
          )}

        <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
          {filteredEmojis().map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              onClick={() => handleEmojiClick(emoji)}
              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>

        {searchTerm && filteredEmojis().length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No emojis found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmojiPicker;
