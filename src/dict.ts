import { MakeJsonIo } from "./db";

type Dict = {
  entries: Entry[];
};

export type Entry = {
  foreign: string[];
  native: string;
  genre: "noun" | "adjective" | "t. verb" | "i. verb";
  provision?: "official" | "provisional";
  definition?: string;
  ts?: number;
  by?: string;
};

const { read: readDict, write: writeDict } = MakeJsonIo<Dict>("dict");

export const wordSplit = (sentence: string, expr = /(\w+)/g) =>
  [...sentence.matchAll(expr)].map((a) => a[a.length - 1]);

export async function appendProvisionalWord(sansTs: Entry) {
  const dict = await readDict();
  dict.entries = dict.entries.filter(
    (entry) => entry.native !== sansTs.native || entry.genre !== sansTs.genre
  );
  const entry = { ...sansTs, ts: Date.now() };
  dict.entries.push(entry);
  await writeDict(dict);
}

export async function randomFreeWord(genre: Entry["genre"]) {
  const dict = await readDict();
  const free = dict.entries.filter(
    (entry) => !entry.foreign.length && entry.genre === genre
  );
  if (!free.length) {
    return undefined;
  }
  const randIdx = Math.floor(Math.random() * free.length);
  return free[randIdx]?.native;
}

export async function randomNativeWord(upto?: number) {
  const dict = await readDict();
  const defined = dict.entries.filter((entry) => entry.foreign.length);
  const max = Math.min(upto ?? defined.length, defined.length);
  const randIdx = Math.floor(Math.random() * max);
  return { native: defined[randIdx]!.native, n: defined.length };
}

export async function nthEntry(n: number, sorted?: (x: Entry[]) => void) {
  const dict = await readDict();
  const defined = dict.entries.filter((entry) => entry.foreign.length);
  if (sorted) {
    sorted(defined);
  }
  return defined[n] as Entry | undefined;
}

export async function lookupNativeWord(wqleWord: string) {
  const dict = await readDict();
  return dict.entries.find(
    (entry) => entry.native === wqleWord && entry.foreign.length
  );
}

export async function lookupForeignWord(word: string) {
  const dict = await readDict();
  const entry = dict.entries.filter(
    (entry) =>
      entry.foreign.map((f) => f.toLowerCase()).includes(word) ||
      entry.native === word
  );
  return entry;
}

export async function allEntries() {
  const dict = await readDict();
  return dict.entries;
}
