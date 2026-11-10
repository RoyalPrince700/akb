const express = require("express");

const {
  addTaskCompletionAttachment,
  deleteTaskCompletionAttachment,
  createTask,
  createTaskChatMessage,
  deleteTaskChatMessage,
  createTodo,
  deleteTask,
  deleteTodo,
  listDirectory,
  listTaskChat,
  listTasks,
  listTodos,
  updateTask,
  updateTodo,
} = require("../controllers/task.controller");
const { protect } = require("../middleware/auth.middleware");
const { uploadTaskCompletion } = require("../middleware/upload.middleware");

const router = express.Router();

router.use(protect);

router.get("/directory", listDirectory);
router.get("/todos", listTodos);
router.post("/todos", createTodo);
router.patch("/todos/:id", updateTodo);
router.delete("/todos/:id", deleteTodo);

router.get("/", listTasks);
router.post("/", createTask);
router.get("/:id/chat", listTaskChat);
router.post("/:id/chat", uploadTaskCompletion.single("file"), createTaskChatMessage);
router.delete("/:id/chat/:messageId", deleteTaskChatMessage);
router.post(
  "/:id/completion-attachments",
  uploadTaskCompletion.single("file"),
  addTaskCompletionAttachment
);
router.delete("/:id/completion-attachments/:attachmentId", deleteTaskCompletionAttachment);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
