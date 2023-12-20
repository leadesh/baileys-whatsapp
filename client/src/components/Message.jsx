/* eslint-disable react/prop-types */
import React from "react";

const Message = (props) => {
  const { message } = props;

  const messageDate = new Date(message.timestamp);
  const formattedDate = messageDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });

  return (
    <div className='flex flex-col gap-1 bg-white p-4 rounded-lg shadow-lg'>
      <div className='flex flex-col gap-1 text-lg font-semibold text-zinc-800'>
        <h1>{message.username}</h1>
        <h1>{message.phoneNumber}</h1>
      </div>
      <div>
        <h1>{message.title}</h1>
        <h1>{message.conversation}</h1>
        <h1>{formattedDate}</h1>
      </div>
    </div>
  );
};

export default Message;
