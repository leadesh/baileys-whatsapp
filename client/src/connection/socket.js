import { io } from "socket.io-client";

const socket = io({
  reconnection: true, // Enable reconnection
  reconnectionAttempts: 5, // Maximum number of reconnection attempts
  reconnectionDelay: 1000,
});

export default socket;
