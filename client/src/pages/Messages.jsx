/* eslint-disable react-hooks/exhaustive-deps */
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { allMessages, delTag, logout, newTag } from "../utils/http";
import socket from "../connection/socket";
import Message from "../components/Message";
import { useNavigate } from "react-router-dom";
import { CiSquarePlus } from "react-icons/ci";
import { useDispatch, useSelector } from "react-redux";
import Tag from "../components/Tag";
import { signInSuccess, signOutSuccess } from "../redux/user/userSlice";
import axios from "axios";

const Messages = () => {
  //   const { data, isLoading } = useQuery({
  //     queryKey: ["messages"],
  //     queryFn: getMessages,
  //   });
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  const tagRef = useRef();

  useEffect(() => {
    if (localStorage.getItem("firstLoadDone") === null) {
      localStorage.setItem("firstLoadDone", 1);
    } else {
      socket.emit("whatsapp connect", currentUser._id);
    }

    socket.on("new message", (message) => {
      setData((messages) => [message, ...messages]);
    });

    socket.on("user disconnected", async () => {
      const { data } = await axios.post("/api/logout");
      dispatch(signOutSuccess);
      navigate("/", { replace: true });
    });

    return () => {
      // Clean up socket event listeners when the component unmounts
      socket.off("user disconnected");
      socket.off("new message");
    };
  }, []);

  const { data: oldMessages } = useQuery({
    queryKey: ["Messages"],
    queryFn: allMessages,
    refetchOnWindowFocus: false,
  });

  const { mutate: addTag } = useMutation({
    mutationFn: newTag,
    onSuccess: (data) => {
      dispatch(signInSuccess(data));
      tagRef.current.value = "";
    },
  });

  const { mutate: removeTag } = useMutation({
    mutationFn: delTag,
    onSuccess: (data) => {
      dispatch(signInSuccess(data));
    },
  });

  const { mutate: logoutHandler, isPending: logoutPending } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      dispatch(signOutSuccess());
    },
  });

  const onAddSubmitHandler = (event) => {
    event.preventDefault();
    addTag({ formData: { tag: tagRef.current.value } });
  };

  const onRemoveSubmitHandler = (tag) => {
    removeTag({ formData: { tag } });
  };

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <div className='mb-5 flex flex-col sm:flex-row gap-2'>
        <form
          className='relative sm:flex-[1_1_240px] h-fit'
          onSubmit={onAddSubmitHandler}
        >
          <input
            type='text'
            className='p-4 border rounded-lg w-full'
            ref={tagRef}
            placeholder='Add new tag...'
          />
          <button
            style={{ top: "50%", transform: "translateY(-50%)" }}
            className='absolute right-5 text-black hover:opacity-80'
          >
            <CiSquarePlus style={{ width: "1.75em", height: "1.75em" }} />
          </button>
        </form>
        <div className='min-h-[56px] sm:h-auto sm:self-stretch flex flex-wrap gap-2 sm:flex-[5_5_599px] p-3 bg-white rounded-lg'>
          <>
            {(!currentUser.tags || currentUser.tags.length === 0) && (
              <h1 className='flex items-center ml-2 text-gray-500'>
                No tags added
              </h1>
            )}
          </>
          {currentUser.tags.map((tag, i) => (
            <Tag
              key={i}
              tag={tag}
              tagDeleteSubmitHandler={onRemoveSubmitHandler}
            />
          ))}
        </div>
      </div>
      <div className='flex justify-between'>
        <p className='text-3xl font-bold mb-3'>Messages</p>
        <p
          onClick={() => logoutHandler()}
          className='text-amber-500 cursor-pointer flex items-center text-lg hover:opacity-80 font-semibold'
        >
          {logoutPending ? "logging out..." : "logout"}
        </p>
      </div>
      <div className='flex flex-col gap-5 mb-8'>
        <div className='flex flex-col gap-5'>
          {data.map((message, i) => (
            <Message
              key={i}
              message={message}
            />
          ))}
        </div>
        <div className='flex flex-col gap-5'>
          {oldMessages &&
            oldMessages.map((message, i) => (
              <Message
                key={i}
                message={message}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Messages;
