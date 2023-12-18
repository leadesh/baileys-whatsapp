/* eslint-disable react-hooks/exhaustive-deps */
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { allMessages, delTag, newTag } from "../utils/http";
import socket from "../connection/socket";
import Message from "../components/Message";
import { useNavigate } from "react-router-dom";
import { CiSquarePlus } from "react-icons/ci";
import { useDispatch, useSelector } from "react-redux";
import Tag from "../components/Tag";
import { signInSuccess } from "../redux/user/userSlice";

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
      // If it's the first load, set the flag in local storage to true and reload the page
      localStorage.setItem("firstLoadDone", 1);
    } else {
      socket.emit("whatsapp connect", currentUser._id);
    }

    socket.on("new message", (message) => {
      setData((messages) => [message, ...messages]);
    });

    socket.on("user disconnected", () => {
      navigate("/authcheck", { replace: true });
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

  const onAddSubmitHandler = (event) => {
    event.preventDefault();
    addTag({ formData: { tag: tagRef.current.value } });
  };

  const onRemoveSubmitHandler = (tag) => {
    removeTag({ formData: { tag } });
  };

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <div className='mb-5 flex gap-2'>
        <form
          className='relative flex-[1_1_auto] h-fit'
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
        <div className='self-stretch flex flex-wrap gap-2 flex-[8_8_auto] p-3 bg-white rounded-lg'>
          {currentUser.tags.map((tag, i) => (
            <Tag
              key={i}
              tag={tag}
              tagDeleteSubmitHandler={onRemoveSubmitHandler}
            />
          ))}
        </div>
      </div>
      <p className='text-center text-3xl font-bold mb-8'>Messages</p>
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
