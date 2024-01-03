1. Setup of backend

- Run <npm install> to install dependencies.
- RUn <npm run dev> for starting local development server.

2. APIs description

- Hit the registeration API "/api/signup" after performing phone number based otp authentication using firebase in the frontend.
  body = { name, password, number }
- Hit the login API "/api/signin" after performing phone number based otp authentication using firebase(or hit the endpoint directly if user has been authenticated with firebase beforehand). body = { number, password }
- Implement this validation in front end before sending password values i.e Validate the password. The password should have 1 upper-case letter, 1 lower-case letter, 1 number, 1 special character and the password should be at least 8 characters.
- Now if login or sigin is successful, server returns a token in a cookie which will be sent automatically with every request.
- Make a socket connection to the backend server and call emit "whatsapp connect" with "id" of user to make a whatsapp socket.
- if User has scanned the QR and authenticated with the whatsapp than server emit "user connected" to frontend. now navigate the user to next page as user has been authenticated.
- If QRCode is timeout user server will emit "request timed out" then give a button to the user to push so that it can reestablish the whatsapp socket connection attempt by emmitting "whatsapp connect" with "id" of user. Now again QR Code will be generated to scan.
- if User has not been authenticated with whatsapp than server will emit "qrCode" with value to receive in callback is qrCode URL to display QR code on the screen for the user to scan.
- After User authenticated with whatsapp server emits "new message" when any new group message is received in whatsapp with callback containing following object.
  {
  \_id,
  title,
  conversation,
  username,
  phoneNumber,
  isStarred,
  timestamp,
  }
- If user has logout from whatsapp app forcefully than server emits "user disconnected" so that user can be logged out of the frontend.
- Hit the endpoints get request "/api/refreshMessages" to get all messages from backend for the particular signed in user.(Authenticated request).
- Hit the endpoint post request "/api/logout" to logout user from app.(Authenticated request).
- Hit the endpoint post request "/api/tag/add" to add a new tag body will be { tag: <string> }.(Authenticated request).
  integrated validation i.e. length of each keyword should not be more than 25 characters and Based on the Package chosen, he can add 10 or 25 keywords.
- Hit the endpoint post request "/api/tag/edit/:id" to edit a tag body will be { tag: <string> }.(Authenticated request).
- Hit the endpoint get request "/api/tag" to get all the tags related to a user.(Authenticated request). body will be
  {
  \_id,
  value,
  }
- Hit the endpoint post request "/api/tag/del/:id" to delete a tag id is the id of the tag.(Authenticated request).
- Hit the endpoint post request "/api/message/star/:id" here id of message to star a particular message.(Authenticated request).
- Hit the endpoint get request "/api/message/star" to get all the user messages that are starred .(Authenticated request).
- Hit the endpoint post request "/api/password" to change the password of the user where the body contains { oldPassword, newPassword }(Authenticated request).
  Here oldPassword and newPassword validate this info . The password should have 1 upper-case letter, 1 lower-case letter, 1 number, 1 special character and the password should be at least 8 characters.
