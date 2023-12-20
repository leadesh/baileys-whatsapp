import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInHelper } from "../utils/http";
import { useMutation } from "@tanstack/react-query";
import { signInSuccess } from "../redux/user/userSlice";
import { useDispatch } from "react-redux";

const SignIn = () => {
  const [user, setUser] = useState({ number: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: signInHelper,
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
      <h1 className='text-center text-3xl font-bold'>Sign in</h1>
      <form
        onSubmit={formSubmitHandler}
        className='flex flex-col gap-3 mt-8'
      >
        <input
          type='text'
          className='p-3 rounded-lg border'
          onChange={formInputChangeHandler}
          id='number'
          placeholder='Phone Number'
        />
        <input
          type='password'
          id='password'
          onChange={formInputChangeHandler}
          className='p-3 rounded-lg border'
          placeholder='Password'
        />
        <button
          disabled={isPending}
          className='p-3 rounded-[32px] text-white uppercase font-bold disabled:opacity-80 transition duration-300 shadow hover:shadow-lg hover:opacity-95 bg-teal-600 hover:bg-teal-700'
        >
          Submit
        </button>
      </form>
      <div className='flex gap-2 mt-2'>
        <p>{"Don't have an account?"}</p>
        <Link to={"/signup"}>
          <span className='text-blue-700'>
            {isPending ? "Signing up..." : "Sign up"}
          </span>
        </Link>
      </div>
    </div>
  );
};

export default SignIn;
