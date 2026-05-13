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

  return (
    <div className="container-fluid h-100">
      {/* JSX остался как в твоем коде, только все переменные используются */}
    </div>
  );
};

export default HomePage;