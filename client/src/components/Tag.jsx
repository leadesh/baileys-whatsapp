/* eslint-disable react/prop-types */
import React from "react";

const Tag = (props) => {
  const { tag, tagDeleteSubmitHandler } = props;
  return (
    <div
      onClick={() => tagDeleteSubmitHandler(tag)}
      className='flex text-xs font-bold bg-green-500 rounded-2xl p-2 text-white cursor-pointer transition shadow-md hover:opacity-95 hover:shadow-lg'
    >
      {tag}
    </div>
  );
};

export default Tag;
