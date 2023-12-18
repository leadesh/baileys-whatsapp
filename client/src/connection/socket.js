import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  reconnection: true, // Enable reconnection
  reconnectionAttempts: 5, // Maximum number of reconnection attempts
  reconnectionDelay: 1000,
});

export default socket;
