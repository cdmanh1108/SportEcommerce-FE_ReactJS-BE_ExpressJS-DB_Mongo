import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redis = createClient({
  url: process.env.REDIS_CLOUD_URL, // Lấy từ Redis Cloud
});

redis.on("error", (err) => console.error("Redis Error:", err));

(async () => {
  await redis.connect();
  console.log("🔗 Connected to Redis Cloud");
})();

export default redis;
