import * as v from "https://deno.land/x/valibot/mod.ts";

const VideoInfoSchema = v.union([
  v.object({
    meta: v.any(),
    data: v.object({
      comment: v.object({
        nvComment: v.object({
          server: v.string(),
          params: v.any(),
          threadKey: v.string(),
        }),
      }),
    }),
  }),
  v.object({
    meta: v.any(),
    data: v.object({
      reasonCode: v.string(),
    }),
  }),
]);

const videoId = Deno.args[0];
if (!videoId) {
  throw new Error("You need to specify a video ID");
}

const videoInfoRes = await fetch(
  `https://www.nicovideo.jp/api/watch/v3_guest/${videoId}?actionTrackId=1g9hKPLpnU_1624006273`,
  {
    headers: {
      "User-Agent":
        "Niconico/1.0 (Linux; U; Android 11; ja-jp; nicoandroid GR1YH) Version/7.11.0",
      "x-frontend-id": "1",
      "x-frontend-version": "7.11.0",
    },
  },
);
const videoInfoResult = v.safeParse(VideoInfoSchema, await videoInfoRes.json());
if (!videoInfoResult.success) {
  console.error("Failed to fetch video info: ");
  console.error(videoInfoResult.issues);
  throw new Error("Failed to fetch video info");
}
if ("reasonCode" in videoInfoResult.output.data) {
  throw new Error(
    "Failed to fetch video info: " +
      videoInfoResult.output.data.reasonCode,
  );
}

const nvComment = videoInfoResult.output.data.comment.nvComment;

const commentData = await fetch(
  nvComment.server + "/v1/threads",
  {
    method: "POST",
    headers: {
      "User-Agent":
        "Niconico/1.0 (Linux; U; Android 11; ja-jp; nicoandroid GR1YH) Version/7.11.0",
      "x-frontend-id": "1",
      "x-frontend-version": "7.11.0",
      "content-type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      params: nvComment.params,
      additionals: null,
      threadKey: nvComment.threadKey,
    }),
  },
);

await Deno.mkdir("data", { recursive: true });
await Deno.writeTextFile(
  "data/" + videoId + ".json",
  JSON.stringify((await commentData.json()).data, null, 2),
);
