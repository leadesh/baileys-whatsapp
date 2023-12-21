/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import socket from "../connection/socket";
import axios from "axios";
import { IoReloadSharp } from "react-icons/io5";

const QRScan = () => {
  const [qr, setQR] = useState(null);
  const navigate = useNavigate();
  const [timedOut, setTimeOut] = useState(false);
  const { currentUser } = useSelector((state) => state.user);
  useEffect(() => {
    socket.emit("whatsapp connect", currentUser._id);

    socket.on("qrCode", (qrCodeDataURL) => {
      setQR(qrCodeDataURL);
    });

    socket.on("user disconnected", async () => {
      const { data } = await axios.post("/api/logout");
      navigate("/", { replace: true });
    });

    socket.on("request timed out", () => {
      setTimeOut(true);
    });

    socket.on("user connected", () => {
      navigate("/messages", { replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      // Clean up socket event listeners when the component unmounts
      socket.off("user connected");
    };
  }, []);

  return (
    <>
      {qr ? (
        <div className='flex flex-col items-center justify-center gap-1 mt-16 relative'>
          {timedOut && (
            <IoReloadSharp
              onClick={() => {
                setTimeOut(false);
                socket.emit("whatsapp connect", currentUser._id);
              }}
              style={{
                width: "3em",
                height: "3em",
                position: "absolute",
                opacity: "100%",
                color: "black",
                zIndex: 30,
                cursor: "pointer",
              }}
            />
          )}
          <img
            src={qr}
            className={timedOut ? "opacity-40" : ""}
          />
          <p className='text-center font-medium'>
            {timedOut ? "QR code timed out" : "scan this QR code to continue"}
          </p>
        </div>
      ) : (
        <h1 className='text-center mt-16'>Checking User status...</h1>
      )}
      <div className='flex flex-col text-lg items-center font-bold justify-center gap-1 mt-4'>
        <p>{currentUser.name}</p>
        <p>{currentUser.number}</p>
      </div>
    </>
  );
};

export default QRScan;
