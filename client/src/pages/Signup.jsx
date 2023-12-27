import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUpHelper } from "../utils/http";
import { useDispatch } from "react-redux";
import { signInSuccess } from "../redux/user/userSlice";

const Signup = () => {
  const [user, setUser] = useState({ name: "", password: "", number: "" });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: signUpHelper,
    onSuccess: (data) => {
      dispatch(signInSuccess(data));
      navigate("/authcheck", { replace: true });
    },
  });

  const formSubmitHandler = (e) => {
    e.preventDefault();
    mutate({ formData: user });
  };

  const formInputChangeHandler = (event) => {
    setUser((prevUser) => ({
      ...prevUser,
      [event.target.id]: event.target.value,
    }));
  };

  return (
    <div className='max-w-lg mx-auto mt-32'>
      <h1 className='text-center text-3xl font-bold'>Sign Up</h1>
      <form
        onSubmit={formSubmitHandler}
        className='flex flex-col gap-3 mt-8'
      >
        <input
          id='name'
          onChange={formInputChangeHandler}
          type='text'
          className='p-3 rounded-lg border'
          placeholder='Name'
        />
        <input
          onChange={formInputChangeHandler}
          id='number'
          type='text'
          className='p-3 rounded-lg border'
          placeholder='Phone Number'
        />
        <input
          onChange={formInputChangeHandler}
          id='password'
          type='password'
          className='p-3 rounded-lg border'
          placeholder='Password'
        />
        <button
          disabled={isPending}
          className='p-3 rounded-[32px] text-white uppercase font-bold transition duration-300 shadow hover:shadow-lg hover:opacity-95 bg-teal-600 hover:bg-teal-700'
        >
          {isPending ? "Submitting..." : `Submit`}
        </button>
        {isError && (
          <p className='text-red-600 text-sm'>{error.response.data.message}</p>
        )}
      </form>
      <div className='flex gap-2 mt-2'>
        <p>Have an account?</p>
        <Link to={"/"}>
          <span className='text-blue-700'>Sign in</span>
        </Link>
      </div>
    </div>
  );
};

export default Signup;
