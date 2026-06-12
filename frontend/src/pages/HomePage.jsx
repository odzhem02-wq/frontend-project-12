import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { io } from "socket.io-client";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import filter from "leo-profanity";

import {
  setChatData,
  setCurrentChannelId,
  addMessage,
  addChannel,
  removeChannel,
  renameChannel,
} from "../store/chatSlice";

filter.loadDictionary("en");
const sanitizeText = (text) => filter.clean(text);

const HomePage = () => {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { channels = [], messages = [], currentChannelId } = useSelector(
    (state) => state.chat
  );

  const [body, setBody] = useState("");
  const addChannelInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [channelToRename, setChannelToRename] = useState(null);
  const [channelToDelete, setChannelToDelete] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const channelNames = channels.map((channel) => channel.name);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [channelsResponse, messagesResponse] = await Promise.all([
          axios.get("/api/v1/channels", { headers }),
          axios.get("/api/v1/messages", { headers }),
        ]);

        const loadedChannels = channelsResponse.data ?? [];
        const loadedMessages = messagesResponse.data ?? [];
        const generalChannel = loadedChannels.find(
          (channel) => channel.name === "general"
        );

        dispatch(
          setChatData({
            channels: loadedChannels,
            messages: loadedMessages,
            currentChannelId:
              generalChannel?.id ?? loadedChannels[0]?.id ?? null,
          })
        );
      } catch (error) {
        console.error(error);
        toast.error(t("toasts.networkError"));
      }
    };

    fetchData();

    const socket = io();
    socket.on("newMessage", (payload) => dispatch(addMessage(payload)));
    socket.on("newChannel", (payload) => dispatch(addChannel(payload)));
    socket.on("removeChannel", ({ id }) => dispatch(removeChannel(id)));
    socket.on("renameChannel", (payload) => dispatch(renameChannel(payload)));

    return () => socket.disconnect();
  }, [token, dispatch, t]);

  useEffect(() => {
    if (showAddForm && addChannelInputRef.current)
      addChannelInputRef.current.focus();
  }, [showAddForm]);

  useEffect(() => {
    if (messageInputRef.current) messageInputRef.current.focus();
  }, [currentChannelId]);

  if (!token) return <Navigate to="/login" />;

  const addChannelSchema = yup.object({
    name: yup
      .string()
      .trim()
      .min(3, t("chat.channelNameLength"))
      .max(20, t("chat.channelNameLength"))
      .notOneOf(channelNames, t("chat.channelExists"))
      .required(t("chat.required")),
  });

  const renameChannelSchema = yup.object({
    name: yup
      .string()
      .trim()
      .min(3, t("chat.channelNameLength"))
      .max(20, t("chat.channelNameLength"))
      .notOneOf(
        channelNames.filter((name) => name !== channelToRename?.name),
        t("chat.channelExists")
      )
      .required(t("chat.required")),
  });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!body.trim() || !currentChannelId) return;

    try {
      await axios.post(
        "/api/v1/messages",
        {
          body: sanitizeText(body.trim()),
          channelId: currentChannelId,
          username,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBody("");
      messageInputRef.current?.focus();
    } catch (error) {
      console.error(error);
      toast.error(t("toasts.networkError"));
    }
  };

  const handleDeleteChannel = async () => {
    if (!channelToDelete) return;
    try {
      await axios.delete(`/api/v1/channels/${channelToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChannelToDelete(null);
      setOpenMenuId(null);
      toast.success(t("toasts.channelRemoved"));
    } catch (error) {
      console.error(error);
      toast.error(t("toasts.networkError"));
    }
  };

  const currentChannel = channels.find((ch) => ch.id === currentChannelId);
  const currentMessages = messages.filter(
    (msg) => msg.channelId === currentChannelId
  );

  return (
    <div style={{ display: "flex", height: "calc(100vh - 80px)", border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden" }}>

      {/* Левая колонка — каналы */}
      <div style={{ width: "260px", background: "#f8f9fa", borderRight: "1px solid #ccc", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ccc" }}>
          <b>{t("chat.channels")}</b>
          <button
            type="button"
            onClick={() => { setShowAddForm(true); setChannelToRename(null); }}
            style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}
            aria-label={t("chat.newChannel")}
          >
            +
          </button>
        </div>

        {showAddForm && (
          <div style={{ padding: "8px" }}>
            <Formik
              initialValues={{ name: "" }}
              validationSchema={addChannelSchema}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                try {
                  const response = await axios.post(
                    "/api/v1/channels",
                    { name: sanitizeText(values.name.trim()) },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  dispatch(setCurrentChannelId(response.data.id));
                  toast.success(t("toasts.channelCreated"));
                  setShowAddForm(false);
                  resetForm();
                } catch (error) {
                  console.error(error);
                  toast.error(t("toasts.networkError"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <label htmlFor="add-channel-name" style={{ display: "none" }}>{t("chat.channelName")}</label>
                  <Field
                    id="add-channel-name"
                    name="name"
                    innerRef={addChannelInputRef}
                    placeholder={t("chat.addChannelPlaceholder")}
                    style={{ width: "100%", padding: "4px", marginBottom: "4px", boxSizing: "border-box" }}
                  />
                  <ErrorMessage name="name" component="div" style={{ color: "red", fontSize: "12px" }} />
                  <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                    <button type="submit" disabled={isSubmitting} style={{ flex: 1 }}>{t("chat.save")}</button>
                    <button type="button" onClick={() => setShowAddForm(false)} style={{ flex: 1 }}>{t("chat.cancel")}</button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        )}

        <ul style={{ listStyle: "none", margin: 0, padding: 0, overflowY: "auto", flex: 1 }}>
          {channels.map((channel) => (
            <li key={channel.id} style={{ display: "flex", alignItems: "center", background: channel.id === currentChannelId ? "#dee2e6" : "transparent" }}>
              <button
                type="button"
                onClick={() => { dispatch(setCurrentChannelId(channel.id)); setOpenMenuId(null); }}
                style={{ flex: 1, textAlign: "left", background: "none", border: "none", padding: "10px 16px", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                # {channel.name}
              </button>

              {channel.removable && (
                <div style={{ position: "relative" }}>
                <button
  type="button"
  onClick={() => setOpenMenuId(openMenuId === channel.id ? null : channel.id)}
  style={{ background: "none", border: "none", padding: "10px 8px", cursor: "pointer" }}
>
  {t("chat.channelManagement")}
</button>
                  {openMenuId === channel.id && (
                    <div style={{ position: "absolute", right: 0, top: "100%", background: "white", border: "1px solid #ccc", borderRadius: "4px", zIndex: 10, minWidth: "130px" }}>
                      <button
                        type="button"
                        onClick={() => { setChannelToRename(channel); setOpenMenuId(null); setShowAddForm(false); }}
                        style={{ display: "block", width: "100%", padding: "8px 12px", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
                      >
                        {t("chat.rename")}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChannelToDelete(channel); setOpenMenuId(null); }}
                        style={{ display: "block", width: "100%", padding: "8px 12px", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
                      >
                        {t("chat.delete")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Правая колонка — чат */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #ccc", background: "#fff" }}>
          <b># {currentChannel?.name ?? t("chat.chatFallback")}</b>
          <div style={{ fontSize: "12px", color: "#666" }}>{currentMessages.length} сообщений</div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {currentMessages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: "8px" }}>
              <b>{msg.username}</b>: {msg.body}
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} style={{ display: "flex", padding: "12px", borderTop: "1px solid #ccc", gap: "8px" }}>
          <label htmlFor="message-input" style={{ display: "none" }}>{t("chat.newMessage")}</label>
        <input
  id="message-input"
  ref={messageInputRef}
  type="text"
  name="body"
  value={body}
  onChange={(e) => setBody(e.target.value)}
  placeholder={t("chat.messagePlaceholder")}
  aria-label={t("chat.newMessage")}
  style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
/>
          <button type="submit" disabled={!body.trim()}>
            {t("chat.send")}
          </button>
        </form>
      </div>

      {/* Модалка — переименование */}
      {channelToRename && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: "8px", padding: "24px", minWidth: "320px" }}>
            <h5>{t("chat.renameChannel")}</h5>
            <Formik
              initialValues={{ name: channelToRename.name }}
              validationSchema={renameChannelSchema}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  await axios.patch(
                    `/api/v1/channels/${channelToRename.id}`,
                    { name: sanitizeText(values.name.trim()) },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  toast.success(t("toasts.channelRenamed"));
                  setChannelToRename(null);
                } catch (error) {
                  console.error(error);
                  toast.error(t("toasts.networkError"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <label htmlFor="rename-channel-name">{t("chat.channelName")}</label>
                  <Field
                    id="rename-channel-name"
                    name="name"
                    style={{ width: "100%", padding: "6px", marginTop: "4px", marginBottom: "4px", boxSizing: "border-box" }}
                    autoFocus
                  />
                  <ErrorMessage name="name" component="div" style={{ color: "red", fontSize: "12px" }} />
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
                    <button type="button" onClick={() => setChannelToRename(null)}>{t("chat.cancel")}</button>
                    <button type="submit" disabled={isSubmitting}>{t("chat.rename")}</button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {/* Модалка — удаление */}
      {channelToDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: "8px", padding: "24px", minWidth: "320px" }}>
            <h5>{t("chat.deleteChannel")}</h5>
            <p>{t("chat.areYouSure")}</p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setChannelToDelete(null)}>{t("chat.cancel")}</button>
              <button
                type="button"
                onClick={handleDeleteChannel}
                style={{ background: "red", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
              >
                {t("chat.remove")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HomePage;