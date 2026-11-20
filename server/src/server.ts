import "dotenv/config";
import { createServer } from "node:http";
import { Server } from "socket.io";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { Message } from "./modules/messages/message.model.js";
import { Conversation } from "./modules/conversations/conversation.model.js";
import { User } from "./modules/auth/user.model.js";

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL ?? "http://localhost:5173", credentials: true },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-room", (roomId: string) => {
    if (roomId) {
      socket.join(roomId);
    }
  });

  socket.on("leave-room", (roomId: string) => {
    if (roomId) {
      socket.leave(roomId);
    }
  });

  socket.on("typing", (data: { roomId: string; userName: string; isTyping: boolean }) => {
    if (data?.roomId) {
      socket.to(data.roomId).emit("user-typing", data);
    }
  });

  socket.on("send-message", async (payload: {
    conversationId: string;
    senderId: string;
    text: string;
    tag?: string;
  }) => {
    try {
      if (!payload?.conversationId || !payload?.senderId || !payload?.text) return;

      const sender = await User.findById(payload.senderId);
      const message = await Message.create({
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        text: payload.text.trim(),
        tag: payload.tag || "GENERAL",
        readBy: [payload.senderId],
      });

      await Conversation.findByIdAndUpdate(payload.conversationId, {
        lastMessage: {
          text: payload.text.trim(),
          senderName: sender?.fullName || "User",
          sentAt: new Date(),
        },
      });

      const populated = await Message.findById(message._id).populate(
        "senderId",
        "fullName email role roomNumber block",
      );

      io.to(payload.conversationId).emit("new-message", populated);
    } catch (err) {
      console.error("Socket send-message error:", err);
    }
  });

  socket.on("disconnect", () => {
    // Clean disconnection
  });
});

await connectDatabase();
const port = Number(process.env.PORT ?? 5000);
httpServer.listen(port, () => console.log(`API running on http://localhost:${port}`));
