import { TextChannel } from "discord.js";
import { entryToMessage } from ".";
//import { MakeJsonIo } from "./db";
import { Entry } from "./dict";
import { sortedByRootThenGenre } from "./wqle";

type Dict = {
  [native: string]: {
    sf: string;
    ts: number;
  };
};

//const { read: readDict, write: writeDict } = MakeJsonIo<Dict>("discord-dict");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function resetChannel(entries: Entry[], channel: TextChannel) {
  //Delete all channel messages
  let deleted: Awaited<ReturnType<typeof channel.bulkDelete>>;
  do {
    deleted = await channel.bulkDelete(100);
    await sleep(1000);
  } while (deleted.size != 0);
  //Populate channel with new messages
  const totalEntries = entries.length;
  entries = entries.filter((e) => e.foreign.length);
  const dict: Dict = {};
  entries = sortedByRootThenGenre<Entry>((e) => e.native)(entries);
  const bulk = 32;
  for (let e = 0; e < entries.length; e += bulk) {
    const batch = entries.slice(e, e + bulk);
    const message = batch.map(entryToMessage).join("\n");
    const { id: sf } = await channel.send(".\n" + message);
    batch.forEach((entry) => {
      dict[entry.native] = { sf, ts: Date.now() };
    });
    await sleep(200);
  }
  //await writeDict(dict);
  await channel.send(
    `${entries.length.toLocaleString()}/${totalEntries.toLocaleString()} entries.`
  );
}

/*
export async function updateChannel(entry: Entry, channel: TextChannel) {
  const dict = await readDict();
  const entries = sortedByRootThenGenre<Entry>((e) => e.native)(
    await allEntries()
  );
  if (entry.native in dict) {
    if (entry.ts ?? 0 >= dict[entry.native].ts) {
      return;
    }
    const message = await channel.messages.fetch(dict[entry.native].sf);
    await message.edit(entryToMessage(entry));
    dict[entry.native] = { sf: message.id, ts: entry.ts ?? Date.now() };
  } else {
    const { id: sf } = await channel.send(entryToMessage(entry));
    dict[entry.native] = { sf, ts: entry.ts ?? Date.now() };
  }
  await writeDict(dict);
}
*/
