import { UserRef } from ".";
import { MakeJsonIo } from "./db";
import {
  lookupForeignWord,
  lookupNativeWord,
  nthEntry,
  randomNativeWord,
} from "./dict";
import { sortedByRootThenGenre, toIpa } from "./wqle";
const { floor, ceil } = Math;

type Classroom = {
  flashcards: {
    native: string;
    scores: { [userSf: string]: number };
  };
};

const { read: readClass, write: writeClass } =
  MakeJsonIo<Classroom>("classroom");

export async function HandleFlashcardsMessage(
  [userSf]: UserRef,
  response: string
) {
  const classroom = await readClass();
  const { flashcards } = classroom;
  let score = flashcards.scores[userSf] ?? 0;

  const idk = response === "idk";
  const correct =
    !idk &&
    (await lookupForeignWord(response)).some(
      (e) => e.native === flashcards.native
    );

  if (correct) {
    flashcards.scores[userSf] = score += 0.25;
  }

  const oldNative = flashcards.native;
  const nextNative = (correct || idk) && (await randomNativeWord(ceil(score)));

  const fmt = (word: string) => `**${word}** /${toIpa(word)}/`;

  if (nextNative) {
    flashcards.native = nextNative.native;
    await writeClass(classroom);

    const nextToLearn = await nthEntry(
      floor(score),
      sortedByRootThenGenre((e) => e.native)
    );
    const nextLearningPoint = nextToLearn
      ? `${fmt(nextToLearn.native)} vua "${nextToLearn.foreign.join(", ")}"`
      : "";
    const nextQuestion = `${nextLearningPoint}\n${fmt(nextNative.native)} vua?`;

    if (idk) {
      const entry = await lookupNativeWord(oldNative);
      const answer = entry
        ? `${fmt(oldNative)} vua "${entry.foreign.join(", ")}".\n`
        : "";
      return `${answer}${nextQuestion}`;
    }

    const emoji = score % 1 === 0 ? ":arrow_up_small:" : "";
    return `ciu! u gau wilx ${score}/${nextNative.n} ${emoji}
${nextQuestion}`;
  }

  return `niubu pqi: ${fmt(flashcards.native)}`;
}
