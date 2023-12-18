/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import socket from "../connection/socket";

const QRScan = () => {
  const [qr, setQR] = useState(null);
  const navigate = useNavigate();
  const [presentState, setPresentState] = useState("status-check");
  const { currentUser } = useSelector((state) => state.user);
  useEffect(() => {
    socket.emit("whatsapp connect", currentUser._id);

    socket.on("qrCode", (qrCodeDataURL) => {
      setQR(qrCodeDataURL);
      setPresentState("scan-qr");
    });

    socket.on("user connected", () => {
      navigate("/messages", { replace: true });
      setPresentState("authenticated");
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
        <div className='flex flex-col items-center justify-center gap-1 mt-16'>
          <img src={qr} />
          <p className='text-center font-medium'>
            scan this QR code to continue
          </p>
        </div>
      ) : (
        <h1 className='text-center mt-16'>Checking User status...</h1>
      )}
      <div className='flex flex-col text-lg items-center font-bold justify-center gap-1 mt-4'>
        <p>{currentUser.username}</p>
        <p>{currentUser.email}</p>
      </div>
    </>
  );
};

export default QRScan;
