import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FaPaperPlane, FaArrowLeft } from "react-icons/fa";
import sodium from "libsodium-wrappers";
import "../styles/watchparty-chat.scss";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
import { db as firestoreDb } from "../firebaseConfig";
import { watchPartyService } from "../lib/services"; // Import watchPartyService

const WatchPartyPlanner = () => {
  const { watchPartyId } = useParams();
  const { user } = useAuth();
  const [watchParty, setWatchParty] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userKeys, setUserKeys] = useState({
    publicKey: null,
    privateKey: null,
  });
  const [userPublicKeys, setUserPublicKeys] = useState([]);
  const messagesEndRef = useRef(null);
  const [userMap, setUserMap] = useState({});

    useEffect(() => {
      // Initialize libsodium
      const initSodium = async () => {
        await sodium.ready;
      };
      initSodium();
    }, []);

  const generateKeyPair = async () => {
    await sodium.ready;
    const { publicKey, privateKey } = sodium.crypto_box_keypair();
    return {
      publicKey: sodium.to_base64(publicKey),
      privateKey: sodium.to_base64(privateKey),
    };
  };

  const fetchWatchParty = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching watch party with ID: ${watchPartyId}`);
      const response = await watchPartyService.get(`/${watchPartyId}`);
      setWatchParty(response.data);

      console.log(`Fetching users for watchPartyId: ${watchPartyId}`);
      const usersResponse = await watchPartyService.get(
        `/${watchPartyId}/users`
      );
      const userPublicKeys = usersResponse.data
        .map((user) => user.publicKey || null)
        .filter(Boolean);
      setUserPublicKeys(userPublicKeys);

      if (
        !localStorage.getItem("publicKey") ||
        !localStorage.getItem("privateKey")
      ) {
        const keys = await generateKeyPair();
        localStorage.setItem("publicKey", keys.publicKey);
        localStorage.setItem("privateKey", keys.privateKey);
        setUserKeys(keys);
        console.log(
          `Sending public key for user ${user.uid} to ${watchPartyId}`
        );
        const postResponse = await watchPartyService.post(
          `/${watchPartyId}/users`,
          { userId: user.uid, publicKey: keys.publicKey }
        );
        console.log("Public key POST response:", postResponse.data);
      } else {
        setUserKeys({
          publicKey: localStorage.getItem("publicKey"),
          privateKey: localStorage.getItem("privateKey"),
        });
        console.log(
          `Re-sending public key for user ${user.uid} to ${watchPartyId}`
        );
        await watchPartyService.post(`/${watchPartyId}/users`, {
          userId: user.uid,
          publicKey: localStorage.getItem("publicKey"),
        });
      }
    } catch (err) {
      console.error(
        "Error fetching watch party:",
        err.message,
        err.response?.data
      );
      setError("Failed to load watch party");
      toast.error("Failed to load watch party");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    try {
      const allPublicKeys = [...userPublicKeys];
      if (!allPublicKeys.includes(userKeys.publicKey)) {
        allPublicKeys.push(userKeys.publicKey);
      }
      const encryptedMessages = await Promise.all(
        allPublicKeys.map(async (publicKey) => {
          return await encryptMessage(newMessage, publicKey);
        })
      );

      const payload = {
        messages: encryptedMessages.map((m, index) => ({
          ...m,
          recipientPublicKey: allPublicKeys[index],
          userId: user.uid,
          timestamp: new Date().toISOString(),
        })),
      };

      const response = await watchPartyService.post(
        `/${watchPartyId}/message`,
        payload
      );
      setMessages([...messages, { ...response.data, message: newMessage }]);
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err.message);
      toast.error("Failed to send message");
    }
  };

  useEffect(() => {
    if (!user) return;

    const db = firestoreDb;
    const messagesQuery = query(
      collection(db, "watchpartyMessages"),
      where("watchPartyId", "==", watchPartyId)
    );

    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
      let docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      docs = docs.sort((a, b) => {
        const getTime = (msg) => {
          const t =
            msg && msg.messages && msg.messages[0] && msg.messages[0].timestamp;
          if (!t) return 0;
          if (typeof t.toDate === "function") return t.toDate().getTime();
          return new Date(t).getTime();
        };
        return getTime(a) - getTime(b);
      });
      const decryptedMessages = await Promise.all(
        docs.map(async (msg) => ({
          ...msg,
          message: await decryptMessage(msg),
        }))
      );
      setMessages(decryptedMessages);
    });

    return () => unsubscribe();
  }, [user, watchPartyId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (user) {
      fetchWatchParty();
    }
  }, [user, watchPartyId]);

  useEffect(() => {
    const userIds = Array.from(new Set(messages.map((msg) => msg.userId)));
    if (userIds.length === 0) return;

    const fetchUsernames = async () => {
      const usersRef = collection(firestoreDb, "users");
      const userDocs = await Promise.all(
        userIds.map((uid) => getDoc(doc(usersRef, uid)))
      );
      const userMapObj = {};
      userDocs.forEach((docSnap) => {
        if (docSnap.exists()) {
          userMapObj[docSnap.id] =
            docSnap.data().name || docSnap.data().username || docSnap.id;
        }
      });
      setUserMap(userMapObj);
    };

    fetchUsernames();
  }, [messages]);

  const rainbowElements = Array.from({ length: 25 }, (_, index) => (
    <div key={index} className="rainbow"></div>
  ));

  async function encryptMessage(message, recipientPublicKeyBase64) {
    await sodium.ready;
    const symmetricKey = sodium.randombytes_buf(
      sodium.crypto_secretbox_KEYBYTES
    );
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const messageUint8 = sodium.from_string(message);
    const encryptedMessage = sodium.crypto_secretbox_easy(
      messageUint8,
      nonce,
      symmetricKey
    );
    const recipientPublicKey = sodium.from_base64(recipientPublicKeyBase64);
    const encryptedSymmetricKey = sodium.crypto_box_seal(
      symmetricKey,
      recipientPublicKey
    );
    return {
      encryptedMessage: sodium.to_base64(encryptedMessage),
      encryptedSymmetricKey: sodium.to_base64(encryptedSymmetricKey),
      nonce: sodium.to_base64(nonce),
    };
  }

  async function decryptMessage(msg) {
    try {
      await sodium.ready;
      if (!msg.messages || !Array.isArray(msg.messages)) return "[No message]";
      const myPublicKey = localStorage.getItem("publicKey");
      const m = msg.messages.find((m) => m.recipientPublicKey === myPublicKey);
      if (!m) return "[No message for you]";
      const encryptedMessage = sodium.from_base64(m.encryptedMessage);
      const encryptedSymmetricKey = sodium.from_base64(m.encryptedSymmetricKey);
      const nonce = sodium.from_base64(m.nonce);
      const privateKeyBase64 = localStorage.getItem("privateKey");
      if (!privateKeyBase64 || !myPublicKey) return "[Missing key]";
      const privateKey = sodium.from_base64(privateKeyBase64);
      const publicKey = sodium.from_base64(myPublicKey);
      const symmetricKey = sodium.crypto_box_seal_open(
        encryptedSymmetricKey,
        publicKey,
        privateKey
      );
      if (!symmetricKey) return "[Decryption failed]";
      const decrypted = sodium.crypto_secretbox_open_easy(
        encryptedMessage,
        nonce,
        symmetricKey
      );
      if (!decrypted) return "[Decryption failed]";
      return sodium.to_string(decrypted);
    } catch (e) {
      return "[Decryption error]";
    }
  }

  if (!user) {
    return (
      <div className="watchparty-chat-page">
        <p>Please log in to access the chat.</p>
        <Link to="/login" className="back-button">
          Go to Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="watchparty-chat-page">
        <div className="tools-spinner">Loading...</div>
      </div>
    );
  }

  if (error || !watchParty) {
    return (
      <div className="watchparty-chat-page">
        <div className="tools-error">{error || "Watch party not found"}</div>
        <Link to="/tools" className="back-button">
          <FaArrowLeft /> Back to Tools
        </Link>
      </div>
    );
  }

  return (
    <div className="watchparty-chat-page">
      <div className="chat-header">
        <Link to="/tools" className="back-button">
          <FaArrowLeft /> Back to Tools
        </Link>
        <h2>{watchParty.title} Chat</h2>
      </div>
      <div className="chat-container">
        <div className="rainbow-overlay">{rainbowElements}</div>
        <div className="tools-watchparty-pinned">
          <h4>Pinned Movies</h4>
          {(watchParty.movies || []).map((movie) => (
            <div key={movie.id} className="tools-watchparty-movie">
              <img
                src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                alt={movie.title}
              />
              <p>
                {movie.title} ({movie.runtime || "N/A"} min)
              </p>
            </div>
          ))}
        </div>
        <div className="chat-messages">
          <div className="chat-messages-inner">
            <div
              style={{
                textAlign: "center",
                color: "#888",
                margin: "8px 0",
                fontSize: "0.95em",
              }}
            >
              End-to-end encrypted
            </div>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${
                  message.userId === user.uid ? "chat-message-own" : ""
                }`}
              >
                <span className="chat-message-user">
                  {userMap[message.userId] || message.userId}:
                </span>
                <span className="chat-message-text">{message.message}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form className="chat-input-form" onSubmit={sendMessage}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="chat-input"
            />
            <button type="submit" className="chat-send-button">
              <FaPaperPlane /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WatchPartyPlanner;
