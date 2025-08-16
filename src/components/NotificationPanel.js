import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db as firestoreDb } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { FaTimes } from 'react-icons/fa';
import '../styles/notification-panel.scss';

const NotificationPanel = ({ onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    if (!user) return;
    const notificationsQuery = query(
      collection(firestoreDb, 'notifications', user.uid, 'userNotifications'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(docs);
    });
    return () => unsubscribe();
  }, [user]);

  // Helper to extract all userIds from a message
  const extractUserIds = (message) => {
    if (!message) return [];
    // Match 20+ alphanumeric chars (Firebase UIDs)
    return Array.from(new Set((message.match(/([A-Za-z0-9]{20,})/g) || [])));
  };

  useEffect(() => {
    // Collect all userIds from notif.userId and from messages
    const userIds = Array.from(
      new Set(
        notifications
          .map(n => n.userId)
          .concat(
            notifications.flatMap(n => extractUserIds(n.message))
          )
          .filter(Boolean)
      )
    );
    if (userIds.length === 0) return;
    const fetchUsernames = async () => {
      const usersRef = collection(firestoreDb, 'users');
      const userDocs = await Promise.all(userIds.map(uid => getDoc(doc(usersRef, uid))));
      const userMapObj = {};
      userDocs.forEach(docSnap => {
        if (docSnap.exists()) {
          userMapObj[docSnap.id] = docSnap.data().name || docSnap.data().username || docSnap.id;
        }
      });
      setUserMap(userMapObj);
    };
    fetchUsernames();
  }, [notifications]);

  // Helper to replace all userIds in message with colored usernames
  const renderMessageWithUsernames = (message) => {
    if (!message) return '';
    return message.replace(/([A-Za-z0-9]{20,})/g, (match) => {
      const username = userMap[match];
      if (username) {
        return `<span class='notification-panel-username'>${username}</span>`;
      }
      return match;
    });
  };

  return (
    <div className="notification-panel-overlay">
      <div className="notification-panel">
        <div className="notification-panel-header">
          <h3>Notifications</h3>
          <button className="notification-panel-close" onClick={onClose} aria-label="Close notifications">
            <FaTimes />
          </button>
        </div>
        <div className="notification-panel-list">
          {notifications.length === 0 ? (
            <div className="notification-panel-empty">No notifications yet.</div>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id} className="notification-panel-item">
                <div className="notification-panel-type">{notif.type || 'Notification'}</div>
                {/* If notif.userId exists, show username */}
                {notif.userId && userMap[notif.userId] && (
                  <span className="notification-panel-username">{userMap[notif.userId]}</span>
                )}
                {/* Render message with usernames replaced */}
                <div
                  className="notification-panel-message"
                  dangerouslySetInnerHTML={{ __html: renderMessageWithUsernames(notif.message) }}
                />
                {notif.createdAt && (
                  <div className="notification-panel-date">
                    {notif.createdAt.toDate ? notif.createdAt.toDate().toLocaleString() : notif.createdAt}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel; 