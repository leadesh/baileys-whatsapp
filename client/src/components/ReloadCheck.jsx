import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Outlet } from "react-router-dom";
import { signInSuccess } from "../redux/user/userSlice";
import { useEffect, useState } from "react";

const ReloadCheck = () => {
  const dispatch = useDispatch();
  const [getMeFetched, setGetMeFetched] = useState(false);

  useEffect(() => {
    axios
      .get("/api/getMe")
      .then((response) => {
        dispatch(signInSuccess(response.data));
        setGetMeFetched(true);
      })
      .catch((err) => {
        setGetMeFetched(true);
      });
  }, []);

  return getMeFetched && <Outlet />;
};

export default ReloadCheck;
