/**
 * References: what people who worked with Sara say about her work.
 *
 * Copied from the recommendations on her LinkedIn profile (Recommendations >
 * Received), 2026-10-29. LinkedIn offers no API for recommendations, so this
 * is a hand-kept copy, which is fine for text that changes about never. If
 * one is edited or withdrawn on LinkedIn, change or remove it here too.
 *
 * Verbatim, always. A quotation is the author's words, so nothing is
 * corrected, shortened or reworded, including small slips; the `quote` is
 * one exact sentence lifted from `body`, never a paraphrase of it. The page
 * leads with the quote and opens the whole `body` as the full letter on
 * request; the build also checks the quote against it.
 *
 * Photos only with the person's consent, and self-hosted in
 * public/references/ at 400px (they are shown at 56px, so even 2x
 * screens get a sharp copy): LinkedIn's image URLs expire, and the CSP
 * allows images from this origin only. Without one there is no stand-in:
 * the card shows just the name.
 *
 * Order is the order shown: the reference closest to the role Sara presents
 * (engineering) leads.
 *
 * Later, references written through the site's own invite flow (Phase 2)
 * will join these, from the database, in the same shape.
 */

/** A paragraph, or a numbered list as the author wrote one. */
export type ReferenceBlock = string | { list: readonly string[] };

export type Reference = {
  name: string;
  /** Their title as LinkedIn shows it, which is their current one. */
  title: string;
  /** How they worked with Sara, in LinkedIn's words. */
  relationship: string;
  /**
   * Where they worked together, shown on the back of the card. Needed
   * because `title` is their CURRENT role, which is usually not where they
   * knew her. Spelled as `org` is in content/experience.ts, so the two
   * sections name a place the same way.
   */
  at: string;
  /** When it was written, YYYY-MM-DD. */
  date: string;
  /** Their LinkedIn profile, so the attribution can be checked. */
  profile: string;
  /** Their photo in public/, only once they have agreed to it. */
  photo?: string;
  /** One sentence from `body`, word for word, set as the pull quote. */
  quote: string;
  /**
   * What the recommendation speaks to, two words at most, so a reader sees
   * each reference's angle before reading it. Ours, not the author's: a
   * summary of their letter, so keep it to what the letter plainly says.
   */
  focus: readonly string[];
  body: readonly ReferenceBlock[];
};

export const references: readonly Reference[] = [
  {
    name: "Seyyid Yiğit",
    title: "Full Stack Engineer at Ravlexo",
    relationship: "Managed Sara directly",
    at: "Mazaka Yazilim",
    date: "2022-12-25",
    profile: "https://www.linkedin.com/in/seyyidyigit/",
    // Shared with his permission (October 2026).
    photo: "/references/seyyid-yigit.jpg",
    quote:
      "Throughout the project, Sara became an influential member of the team and despite going to school, she consistently completed all her tasks on time and even ahead of schedule.",
    focus: ["Engineering", "Delivery"],
    body: [
      "We worked with Sara for a while, both in the office and remotely, on the development of the frontend (React) side of the e-commerce project. Throughout the project, Sara became an influential member of the team and despite going to school, she consistently completed all her tasks on time and even ahead of schedule. I was impressed by her ability to quickly grasp the subjects or platforms that she needed to learn, which helped her to work effectively on the project. Additionally, it was a pleasure to work with Sara because of her friendly personality and pleasant demeanor when chatting.",
    ],
  },
  {
    // LinkedIn has "Nimet BULUT"; set in ordinary capitals here so it
    // matches the other names. The quote and letter stay verbatim; the name
    // is display.
    name: "Nimet Bulut",
    title: "International Relations Office Director at Abdullah Gül University",
    relationship: "Managed Sara directly",
    at: "Abdullah Gül University International Office",
    date: "2023-11-10",
    profile: "https://www.linkedin.com/in/nimet-bulut-999b71115/",
    quote:
      "Sara proved to be very hardworking, reliable and dynamic, continuously showcasing a positive mindset and attitude.",
    focus: ["Leadership", "Coordination"],
    body: [
      "With this letter, I would like to recommend our student Sara Abouroumia for her work during the 2023 Abdullah Gül University International Student Welcome Program (September 1-30, 2023) and its preparation/follow-up periods.",
      "Sara applied to integrate the official Welcome Program Volunteer team for that period. Her duties included the following:",
      {
        list: [
          "Coordinating Welcome Program Volunteer team and distributing tasks. Sara assisted to the International Office to organize Orientation Program 2023.",
          "Comforting and assisting incoming students via online and personal communication before their registration, and therefore improving the University’s international students enrolment rate. Sara displayed significant social skills, empathy, conviction skills, communication skills and sales techniques.",
          "Organizing the dormitory registration and settling processes, staying up late at night to welcome newcomers.",
          "Guiding newcomers on campus, with the different procedures and processes such as the university/course registrations, IT, course selection, payments, etc.",
          "Organizing off campus tours/visits for insurance, private dorms, tax office, phone registration, transportation, immigration to help newcomers. Organizing off campus trips giving the chance to newcomers to discover touristic places of Kayseri.",
          "Designing and performing a “Campus Tour” for about 50 students taking them to key areas of the campus like the library, classrooms, seminar and conference rooms, cafeteria, cafés, laboratories, etc.",
        ],
      },
      "Throughout the two months of duty for the University’s International Office, including the four-week Welcome Program, Sara proved to be very hardworking, reliable and dynamic, continuously showcasing a positive mindset and attitude. She was caring, creative, helpful, well organized and mature, conveying a good image of the Institution.",
      "It was a real pleasure to work with Sara and I look forward to collaborating again with her in the near future.",
    ],
  },
];

/** Where all of them can be read and verified at the source. */
export const REFERENCES_SOURCE =
  "https://www.linkedin.com/in/sara-abouroumia-7b5665210/details/recommendations/";
