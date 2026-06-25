import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import { Lesson, DebateTopic } from "./types";

const INITIAL_LESSONS: Lesson[] = [
  {
    id: "lesson_grammar_1",
    title: "Mastering the Present Perfect Tense",
    category: "grammar",
    difficultyLevel: "Intermediate",
    contentBody: `### Understanding Present Perfect

The Present Perfect tense is used to describe an action that happened at an unspecified time in the past, or an action that began in the past and continues in the present.

**Formula:** Subject + has/have + past participle

#### Key Usage Cases:
1. **Life Experiences:** Actions that happened in someone's lifetime.
   * *Example:* "I have traveled to England twice."
2. **Change Over Time:** Actions that show improvement or development.
   * *Example:* "Your English speaking has improved significantly this semester."
3. **Accomplishments:** Milestones or achievements.
   * *Example:* "Our school has successfully launched the Fluency Campaign!"
4. **An uncompleted action you expect to happen:**
   * *Example:* "The student hasn't submitted his essay yet."

#### Exercises & Writing Challenge:
Try writing three sentences about your English learning journey using the Present Perfect. Look for opportunities to use keywords like *already*, *yet*, *since*, and *for*.`,
    resources: ["Cambridge English Grammar in Use", "British Council - LearnEnglish"],
    createdAt: new Date().toISOString()
  },
  {
    id: "lesson_vocab_1",
    title: "Persuasive Vocabulary for Debates",
    category: "vocabulary",
    difficultyLevel: "Advanced",
    contentBody: `### Expand Your Vocabulary: Persuasive Expressions

To succeed in active speaking and written debates, you need high-impact transition words and expressive vocabulary. Here are key terms to elevate your speech:

#### 1. Formulating Arguments
* **To assert** (verb): To state a fact or belief confidently and forcefully.
  * *Usage:* "I assert that technology in classrooms enhances pupil engagement."
* **Compelling** (adjective): Evoking interest or attention in a powerful, irresistible way.
  * *Usage:* "The speaker made a compelling case for educational equality."

#### 2. Transition & Contrast
* **Consequently** (adverb): As a result.
  * *Usage:* "Many students lack speaking practice; consequently, their confidence suffers."
* **On the contrary** (phrase): Used to intensify a denial or opposition.
  * *Usage:* "Fluency is not about speed; on the contrary, it is about clarity and connection."

#### 3. Emphasizing Points
* **Paramount** (adjective): More important than anything else; supreme.
  * *Usage:* "Developing confidence is of paramount importance for non-native speakers."
* **Inevitably** (adverb): As is certain to happen; unavoidably.
  * *Usage:* "With consistent practice, you will inevitably achieve fluency."`,
    resources: ["Oxford Advanced Learner's Dictionary", "Debating SA Manual"],
    createdAt: new Date().toISOString()
  },
  {
    id: "lesson_challenge_1",
    title: "Weekly Speaking Challenge: A Place That Inspires You",
    category: "challenge",
    difficultyLevel: "Beginner",
    contentBody: `### 🎙️ Weekly Speaking Challenge

**Topic:** Describe a place in your community, school, or home that truly inspires you.

#### What to include in your audio submission:
1. **Where is it?** Give a clear spatial description.
2. **What does it look like?** Use vivid adjectives (e.g., quiet, spacious, colorful, peaceful).
3. **Why does it inspire you?** Explain the feelings or thoughts you experience there.
4. **Who else is there?** Mention if you share this space with others.

#### Speaking tips for Beginners:
* Speak slowly. Pausing to think is completely natural.
* Focus on clear pronunciation of end-consonants (e.g., 'place', 'inspires', 'quiet').
* Keep your submission between 45 seconds and 2 minutes.`,
    resources: ["Speaking Fluency Standards Booklet"],
    createdAt: new Date().toISOString()
  },
  {
    id: "lesson_prompt_1",
    title: "Writing Prompt: Letter to Your Future Self",
    category: "prompt",
    difficultyLevel: "Intermediate",
    contentBody: `### 📝 Writing Practice: Letter to Your Future Self

**Prompt:** Write a formal or informal letter addressed to yourself 5 years from now.

#### Requirements:
* **Format:** Use standard letter structure (salutation, body paragraphs, sign-off).
* **Length:** Between 150 to 300 words.
* **Themes to explore:**
  1. Your current goals in the English Fluency Campaign.
  2. The challenges you are facing now and how you hope to overcome them.
  3. A description of who you hope to become (professionally or personally).
  4. Questions you want to ask your future self.

#### Grammar Target:
Incorporate both **Future Tense** (will, going to) and **Present Perfect** (I have achieved).`,
    resources: ["Platform Letter Writing Guide"],
    createdAt: new Date().toISOString()
  }
];

const INITIAL_DEBATES: DebateTopic[] = [
  {
    id: "debate_1",
    title: "Artificial Intelligence vs. Human Teachers in Language Learning",
    description: "Can AI apps and bots replace human teachers for students learning a second language, or is the human connection irreplaceable?",
    difficultyLevel: "Intermediate",
    createdAt: new Date().toISOString(),
    createdBy: "admin_system",
    status: "active",
    votesFor: 0,
    votesAgainst: 0,
    voters: {}
  },
  {
    id: "debate_2",
    title: "Should English Be the Main Medium of Instruction in All High Schools?",
    description: "Would teaching all academic subjects (science, math, history) in English prepare students better for a globalized world, or would it lead to local cultural and academic disadvantages?",
    difficultyLevel: "Advanced",
    createdAt: new Date().toISOString(),
    createdBy: "admin_system",
    status: "active",
    votesFor: 0,
    votesAgainst: 0,
    voters: {}
  }
];

/**
 * Seeds initial content to Firestore collections if they are empty.
 */
export async function seedDatabaseIfNeeded() {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), 1500)
  );

  try {
    const lessonsPromise = getDocs(collection(db, "lessons"));
    const lessonsSnap = await Promise.race([lessonsPromise, timeoutPromise]);
    if (lessonsSnap.empty) {
      console.log("Seeding initial lessons...");
      for (const lesson of INITIAL_LESSONS) {
        try {
          await setDoc(doc(db, "lessons", lesson.id), lesson);
        } catch (writeErr) {
          console.warn(`Skipping seeding for lesson ${lesson.id}:`, writeErr);
        }
      }
    }

    const debatesPromise = getDocs(collection(db, "debates"));
    const debatesSnap = await Promise.race([debatesPromise, timeoutPromise]);
    if (debatesSnap.empty) {
      console.log("Seeding initial debates...");
      for (const debate of INITIAL_DEBATES) {
        try {
          await setDoc(doc(db, "debates", debate.id), debate);
        } catch (writeErr) {
          console.warn(`Skipping seeding for debate ${debate.id}:`, writeErr);
        }
      }
    }
  } catch (error) {
    console.warn("Database seeding bypassed or timed out (offline/sandboxed):", error);
  }
}
export { INITIAL_LESSONS, INITIAL_DEBATES };
