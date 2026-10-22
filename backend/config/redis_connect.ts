import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is not defined");
}

const redisConnect = new Redis(redisUrl);

redisConnect.on("connect", () => {
  console.log("redis connected");
});

export default redisConnect;