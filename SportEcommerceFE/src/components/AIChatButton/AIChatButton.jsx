import { useState, useRef, useEffect, useCallback } from "react";
import { FaRobot, FaTimes, FaArrowRight } from "react-icons/fa";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const AIChatButton = () => {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <div className="fixed bottom-40 lg:bottom-20 right-10 z-50">
        <button
          onClick={() => setShowChat((prev) => !prev)}
          className="bg-primary hover:opacity-80 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-[0_6px_14px_0_rgba(255,255,255,0.3)] transition-all"
          aria-label="Mo tro ly AI"
        >
          <FaRobot className="text-2xl" />
        </button>
      </div>

      {showChat && <CompactChatBot onClose={() => setShowChat(false)} />}
    </>
  );
};

const createGreetingMessage = () => ({
  text: "Chào bạn, tôi có thể giúp gì cho bạn hôm nay?",
  sender: "bot",
  timestamp: new Date().toLocaleString(),
});

const extractApiResult = (response) =>
  response?.data?.data !== undefined
    ? response.data.data
    : response?.data?.result !== undefined
      ? response.data.result
      : null;

const URL_PATTERN = /(https?:\/\/[^\s]+)/gi;
const PRODUCT_PREFIX_PATTERN = /^s[aả]n\s+ph[aẩ]m\s+/i;

const normalizeForMatch = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[*_`#[\]()>-]/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const stripTrailingLinkSection = (text) => {
  const raw = String(text || "").trim();
  if (!raw) return raw;

  const markerPatterns = ["\nlink sản phẩm:", "\nlink san pham:"];
  const normalized = raw.toLowerCase();
  let cutIndex = -1;

  markerPatterns.forEach((marker) => {
    const index = normalized.lastIndexOf(marker);
    if (index > cutIndex) {
      cutIndex = index;
    }
  });

  if (cutIndex === -1) {
    return raw;
  }

  return raw.slice(0, cutIndex).trim();
};

const buildReplyWithProductLinks = (reply, productLinks = []) => {
  const baseReply = stripTrailingLinkSection(reply);
  if (/\n\s*-\s*link\s*:\s*https?:\/\//i.test(baseReply)) {
    return baseReply;
  }

  if (!Array.isArray(productLinks) || productLinks.length === 0) {
    return baseReply;
  }

  const lines = baseReply ? baseReply.split("\n") : [];
  const dedupByTitle = new Map();

  productLinks.forEach((item) => {
    const url = String(item?.url || "").trim();
    if (!url) return;
    if (baseReply.includes(url)) return;

    const rawTitle = String(item?.title || "")
      .trim()
      .replace(PRODUCT_PREFIX_PATTERN, "");
    const matchKey = normalizeForMatch(rawTitle);
    const fallbackKey = String(item?.product_id || "").trim() || url;
    const dedupeKey = matchKey || fallbackKey;

    if (!dedupByTitle.has(dedupeKey)) {
      dedupByTitle.set(dedupeKey, {
        title: rawTitle || null,
        matchKey,
        url,
      });
    }
  });

  if (dedupByTitle.size === 0) {
    return baseReply;
  }

  for (const item of dedupByTitle.values()) {
    const targetLineIndex = lines.findIndex((line, index) => {
      if (!item.matchKey) return false;

      const currentLine = normalizeForMatch(line);
      if (!currentLine.includes(item.matchKey)) return false;

      const nextLine = String(lines[index + 1] || "");
      return !/^\s*-\s*link\s*:/i.test(nextLine);
    });

    if (targetLineIndex === -1) {
      continue;
    }

    lines.splice(targetLineIndex + 1, 0, `   - Link: ${item.url}`);
  }

  return lines.join("\n").trim();
};

const isUrl = (value) => /^https?:\/\/[^\s]+$/i.test(String(value || "").trim());

const renderLineWithLinks = (line, lineIndex) => {
  const segments = String(line || "").split(URL_PATTERN);

  return (
    <div key={`line-${lineIndex}`} className="break-words">
      {segments.map((segment, segmentIndex) => {
        const key = `seg-${lineIndex}-${segmentIndex}`;
        if (!isUrl(segment)) {
          return <span key={key}>{segment}</span>;
        }

        return (
          <a
            key={key}
            href={segment}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline break-all"
          >
            {segment}
          </a>
        );
      })}
    </div>
  );
};

const CompactChatBot = ({ onClose }) => {
  const [messages, setMessages] = useState([createGreetingMessage()]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const endOfMessagesRef = useRef(null);

  const { token } = useAuth();

  const getAuthHeaders = useCallback(
    () => ({
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }),
    [token],
  );

  const mapApiMessageToUi = (message) => ({
    text: message?.content || "",
    sender: message?.role === "assistant" ? "bot" : "user",
    timestamp: message?.createdAt
      ? new Date(message.createdAt).toLocaleString()
      : new Date().toLocaleString(),
  });

  const fetchConversationMessages = useCallback(
    async (targetConversationId) => {
      if (!targetConversationId) return [];

      const response = await axios.get(
        `${API_URL}/chat-message/get-by-conversation/${targetConversationId}`,
        {
          params: {
            sort: "asc",
            limit: 100,
          },
          headers: getAuthHeaders(),
        },
      );

      const payload = extractApiResult(response) || {};
      const items = Array.isArray(payload?.items) ? payload.items : [];

      return items
        .filter((item) => item?.role === "user" || item?.role === "assistant")
        .map(mapApiMessageToUi);
    },
    [getAuthHeaders],
  );

  const createNewConversation = useCallback(async () => {
    if (!token) return null;

    const response = await axios.post(
      `${API_URL}/chat-conversation/create`,
      { title: "Cuoc tro chuyen moi" },
      { headers: getAuthHeaders() },
    );

    const payload = extractApiResult(response) || {};
    return payload?._id || null;
  }, [getAuthHeaders, token]);

  useEffect(() => {
    const initHistory = async () => {
      if (token) {
        try {
          const response = await axios.get(
            `${API_URL}/chat-conversation/get-all`,
            {
              params: {
                page: 1,
                limit: 1,
              },
              headers: getAuthHeaders(),
            },
          );

          const payload = extractApiResult(response) || {};
          const latestConversation = Array.isArray(payload?.items)
            ? payload.items[0]
            : null;

          if (!latestConversation?._id) {
            setConversationId(null);
            setMessages([createGreetingMessage()]);
            return;
          }

          const historyMessages = await fetchConversationMessages(
            latestConversation._id,
          );

          setConversationId(latestConversation._id);
          setMessages(
            historyMessages.length > 0
              ? historyMessages
              : [createGreetingMessage()],
          );
        } catch {
          setConversationId(null);
          setMessages([createGreetingMessage()]);
        }
        return;
      }

      const savedMessages = localStorage.getItem("chatMessages");
      const savedConversationId = localStorage.getItem("chatConversationId");

      setConversationId(savedConversationId || null);
      if (!savedMessages) {
        setMessages([createGreetingMessage()]);
        return;
      }

      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(
          Array.isArray(parsed) && parsed.length > 0
            ? parsed
            : [createGreetingMessage()],
        );
      } catch {
        setMessages([createGreetingMessage()]);
      }
    };

    initHistory();
  }, [fetchConversationMessages, getAuthHeaders, token]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (token) return;

    localStorage.setItem("chatMessages", JSON.stringify(messages));
    if (conversationId) {
      localStorage.setItem("chatConversationId", conversationId);
    } else {
      localStorage.removeItem("chatConversationId");
    }
  }, [messages, token, conversationId]);

  const handleResetChat = async () => {
    setMessages([createGreetingMessage()]);
    setInput("");

    if (!token) {
      setConversationId(null);
      localStorage.removeItem("chatMessages");
      localStorage.removeItem("chatConversationId");
      return;
    }

    try {
      const newConversationId = await createNewConversation();
      setConversationId(newConversationId);
    } catch {
      setConversationId(null);
    }
  };

  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    const userMessage = {
      text: trimmedInput,
      sender: "user",
      timestamp: new Date().toLocaleString(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/chat`,
        {
          message: trimmedInput,
          conversation_id: token ? conversationId : undefined,
          page_context: {
            path: window.location?.pathname || null,
            href: window.location?.href || null,
          },
          history: !token
            ? nextMessages.map((msg) => ({
                role: msg.sender === "bot" ? "assistant" : "user",
                content: msg.text,
              }))
            : undefined,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      const payload = extractApiResult(response);
      const assistantReply =
        typeof payload === "string"
          ? payload
          : buildReplyWithProductLinks(
              payload?.reply || "Xin lỗi, có lỗi xảy ra!",
              payload?.product_links,
            );

      if (payload?.conversation_id) {
        setConversationId(payload.conversation_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          text: assistantReply,
          sender: "bot",
          timestamp: new Date().toLocaleString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          text: "Bot gặp lỗi kết nối!",
          sender: "bot",
          timestamp: new Date().toLocaleString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-[70px] lg:bottom-3 right-2 lg:right-4 z-[70] bg-white shadow-2xl w-[calc(100vw-1rem)] sm:w-[28rem] lg:w-[34rem] h-[68vh] max-h-[52rem] min-h-[28rem] overflow-hidden border border-gray-200 flex flex-col rounded-xl">
      <div className="bg-primary text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FaRobot className="text-lg" />
          <h3 className="font-semibold text-lg">Trợ lý AI</h3>
        </div>
        <div className="flex items-center gap-5">
          <button
            onClick={handleResetChat}
            className="text-white hover:text-gray-200 text-base"
          >
            Làm mới
          </button>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-lg"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            } mb-3`}
          >
            <div
              className={`p-3.5 rounded-xl max-w-[88%] ${
                message.sender === "user"
                  ? "bg-[#171717] text-white text-right"
                  : "bg-gray-200 text-black"
              }`}
            >
              <div className="text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                {String(message.text || "")
                  .split("\n")
                  .map((line, lineIndex) => renderLineWithLinks(line, lineIndex))}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-base text-gray-500 italic">Đang trả lời...</div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-3 border-t bg-white">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="w-full bg-gray-100 p-3 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:border-black resize-none h-14 text-[15px] sm:text-base"
            placeholder="Nhập tin nhắn..."
          />
          <button
            onClick={handleSendMessage}
            disabled={loading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-black text-lg"
          >
            <FaArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatButton;
