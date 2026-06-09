require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGO_URI;

async function reset() {
  await mongoose.connect(MONGODB_URI);
  const User = require("./src/models/User");
  const CourseProgress = require("./src/models/CourseProgress");

  const user = await User.findOne({ email: "finetex700@gmail.com" });
  if (!user) {
    console.log("User not found");
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (${user.email})`);

  const result = await CourseProgress.deleteOne({
    user: user._id,
    courseId: "human-resource-management",
  });

  console.log(`Deleted ${result.deletedCount} progress record(s) for HRM course`);
  console.log("User can now retake the HRM course and earn 10 gems on completion.");
  process.exit(0);
}

reset().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
