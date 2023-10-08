import { stringify } from "https://deno.land/x/xml/mod.ts";

const videoId = Deno.args[0];
if (!videoId) {
  throw new Error("You need to specify a video ID");
}

const data: {
  threads: {
    id: string;
    commentCount: number;
    comments: {
      body: string;
      no: number;
      postedAt: string;
      vposMs: number;
      comment: string;
      userId: string;
      commands: string[];
      nicoruCount?: number;
      score?: number;
      isPremium?: boolean;
    }[];
  }[];
} = JSON.parse(await Deno.readTextFile(`data/${videoId}.json`));

const xmlData = [];

for (const thread of data.threads) {
  if (thread.commentCount > 0) {
    for (const comment of thread.comments) {
      xmlData.push({
        "@thread": thread.id,
        "@no": comment.no,
        "@vpos": comment.vposMs / 10,
        "@anonymity": "1",
        "@userId": comment.userId,
        "@date": (new Date(comment.postedAt)).getTime() / 1000,
        "@nicoru": comment.nicoruCount ?? 0,
        "@score": (comment.score ?? 0).toString(),
        "@premium": comment.score ? "1" : "0",
        "@mail": comment.commands.join(" "),
        "#text": comment.body,
      });
    }

    await Deno.writeTextFile(
      `data/${videoId}.xml`,
      stringify({
        packet: {
          chat: xmlData,
        },
      }),
    );
  }
}
