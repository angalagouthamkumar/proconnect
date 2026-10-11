import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import User from "./models/user.model.js";
import Profile from "./models/profile.model.js";
import Post from "./models/posts.model.js";
import Comment from "./models/comments.model.js";
import Connection from "./models/connections.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.mongo_uri;

const PASSWORD = "Test@123";

// ---------- IMAGE SETTINGS ----------
// "download": saves images into your backend folders and stores only filenames.
// "url": stores full https links in the DB (no downloads).
const IMAGE_MODE = "download";
const BACKEND_DIR = path.dirname(fileURLToPath(import.meta.url)); // seed.js must sit in backend/
const PROFILE_DIR = path.join(BACKEND_DIR, "profile"); // profile pictures  -> served at /profile
const UPLOADS_DIR = path.join(BACKEND_DIR, "uploads"); // post media         -> served at /uploads
const MEDIA_AS_ARRAY = true; // your Post model: media is an Array
const POST_FILETYPE = "jpeg"; // value stored in post.filetype for image posts

// ================= SEED DATA =================
// Fictional professional profiles (not real individuals). All members work in IT.

const usersData = [
  { name: "Aarav Mehta", username: "aaravmehta", email: "aarav@proconnect.dev" },
  { name: "Priya Sharma", username: "priyasharma", email: "priya@proconnect.dev" },
  { name: "Rohan Kapoor", username: "rohankapoor", email: "rohan@proconnect.dev" },
  { name: "Ananya Iyer", username: "ananyaiyer", email: "ananya@proconnect.dev" },
  { name: "Vikram Rao", username: "vikramrao", email: "vikram@proconnect.dev" },
  { name: "Neha Verma", username: "nehaverma", email: "neha@proconnect.dev" },
  { name: "Arjun Nair", username: "arjunnair", email: "arjun@proconnect.dev" },
  { name: "Kavya Reddy", username: "kavyareddy", email: "kavya@proconnect.dev" },
  { name: "Aditya Singh", username: "adityasingh", email: "aditya@proconnect.dev" },
  { name: "Meera Joshi", username: "meerajoshi", email: "meera@proconnect.dev" },
  { name: "Siddharth Malhotra", username: "siddharthmalhotra", email: "siddharth@proconnect.dev" },
  { name: "Ishita Banerjee", username: "ishitabanerjee", email: "ishita@proconnect.dev" },
  { name: "Karan Bhatia", username: "karanbhatia", email: "karan@proconnect.dev" },
  { name: "Divya Menon", username: "divyamenon", email: "divya@proconnect.dev" },
  { name: "Rahul Deshpande", username: "rahuldeshpande", email: "rahul@proconnect.dev" },
  { name: "Sneha Kulkarni", username: "snehakulkarni", email: "sneha@proconnect.dev" },
  { name: "Harsh Agarwal", username: "harshagarwal", email: "harsh@proconnect.dev" },
  { name: "Pooja Nambiar", username: "poojanambiar", email: "pooja@proconnect.dev" },
  { name: "Manish Gupta", username: "manishgupta", email: "manish@proconnect.dev" },
  { name: "Tanvi Choudhary", username: "tanvichoudhary", email: "tanvi@proconnect.dev" },
  { name: "Nikhil Pillai", username: "nikhilpillai", email: "nikhil@proconnect.dev" },
  { name: "Shreya Bhat", username: "shreyabhat", email: "shreya@proconnect.dev" },
  { name: "Yash Thakur", username: "yashthakur", email: "yash@proconnect.dev" },
  { name: "Riya Fernandes", username: "riyafernandes", email: "riya@proconnect.dev" },
  { name: "Devansh Kulshreshtha", username: "devanshk", email: "devansh@proconnect.dev" },
];

// helper: p(bio, [company, position, years], [pastCompany, pastPosition, pastYears], [college, degree, field])
const p = (bio, cur, past, edu) => ({
  bio,
  currentwork: { company: cur[0], position: cur[1], years: cur[2] },
  postwork: [{ company: past[0], position: past[1], years: past[2] }],
  education: [{ college: edu[0], degree: edu[1], fieldOfStudy: edu[2] }],
});

const profilesData = [
  p("Software engineer passionate about building scalable products and clean developer experiences.", ["Microsoft", "Software Engineer", 4], ["Zoho", "Software Developer", 2], ["RV College of Engineering", "B.E.", "Computer Science"]),
  p("Product designer focused on simple interfaces, design systems and meaningful user experiences.", ["Razorpay", "Product Designer", 3], ["Deloitte", "UX Designer", 2], ["National Institute of Design", "B.Des", "Interaction Design"]),
  p("Full stack developer building modern web applications with React, Node.js and MongoDB.", ["Freshworks", "Full Stack Developer", 5], ["TCS", "Web Developer", 2], ["Osmania University", "B.Tech", "Information Technology"]),
  p("Data scientist interested in machine learning, analytics and turning data into useful products.", ["Flipkart", "Data Scientist", 4], ["Mu Sigma", "Data Analyst", 2], ["IIT Madras", "M.Tech", "Data Science"]),
  p("DevOps engineer working on cloud infrastructure, automation and reliable deployment systems.", ["Amazon", "DevOps Engineer", 6], ["Infosys", "Cloud Engineer", 3], ["PES University", "B.Tech", "Computer Science"]),
  p("Frontend developer who enjoys crafting fast, accessible and responsive interfaces.", ["Atlassian", "Frontend Developer", 4], ["Wipro", "UI Developer", 2], ["Delhi University", "B.Sc.", "Computer Science"]),
  p("Backend engineer working on APIs, databases and distributed systems.", ["Swiggy", "Backend Engineer", 5], ["UST", "Software Engineer", 3], ["NIT Calicut", "B.Tech", "Computer Science"]),
  p("UX researcher passionate about understanding people and turning research into better products.", ["Adobe", "UX Researcher", 4], ["Accenture", "UX Analyst", 2], ["University of Hyderabad", "M.A.", "Human Computer Interaction"]),
  p("AI engineer exploring machine learning systems, LLM applications and developer tools.", ["Google", "AI Engineer", 3], ["Cognizant", "Machine Learning Engineer", 2], ["BITS Pilani", "B.E.", "Computer Science"]),
  p("Product manager connecting engineering, design and business to build products people love.", ["PhonePe", "Product Manager", 5], ["Paytm", "Associate Product Manager", 2], ["IIM Bangalore", "MBA", "Product Management"]),
  p("Engineering manager focused on team growth, delivery excellence and technical strategy.", ["Uber", "Engineering Manager", 7], ["Ola", "Senior Software Engineer", 4], ["IIT Bombay", "B.Tech", "Computer Science"]),
  p("QA automation lead building reliable test frameworks and shifting quality left.", ["Salesforce", "QA Automation Lead", 6], ["Capgemini", "Test Engineer", 3], ["Jadavpur University", "B.E.", "Information Technology"]),
  p("Cybersecurity analyst specialising in threat detection, incident response and secure design.", ["Palo Alto Networks", "Cybersecurity Analyst", 4], ["HCLTech", "Security Associate", 2], ["VIT Vellore", "B.Tech", "Information Security"]),
  p("Android developer building polished, performant mobile apps with Kotlin and Jetpack Compose.", ["CRED", "Android Developer", 4], ["Byju's", "Mobile Developer", 2], ["Amrita University", "B.Tech", "Computer Science"]),
  p("Cloud architect designing resilient, cost-efficient multi-region systems.", ["Oracle", "Cloud Architect", 8], ["IBM", "Cloud Consultant", 4], ["COEP Pune", "B.Tech", "Computer Engineering"]),
  p("IT talent acquisition partner helping engineering teams hire and grow great people.", ["Zomato", "IT Talent Acquisition Partner", 5], ["Randstad", "Technical Recruiter", 3], ["Symbiosis Institute", "MBA", "Human Resources"]),
  p("Site reliability engineer focused on observability, SLOs and incident management.", ["Cisco", "Site Reliability Engineer", 5], ["Tech Mahindra", "Systems Engineer", 3], ["IIIT Hyderabad", "B.Tech", "Computer Science"]),
  p("Data engineer building scalable pipelines and trustworthy analytics platforms.", ["Walmart Global Tech", "Data Engineer", 4], ["LTIMindtree", "ETL Developer", 3], ["NIT Surathkal", "B.Tech", "Computer Science"]),
  p("Solutions architect helping enterprises modernise data and cloud platforms.", ["Snowflake", "Solutions Architect", 6], ["Deloitte", "Technology Consultant", 4], ["IIT Delhi", "M.Tech", "Computer Science"]),
  p("IT business analyst translating complex requirements into clear, measurable outcomes.", ["Goldman Sachs", "IT Business Analyst", 3], ["EY", "Technology Risk Analyst", 2], ["Symbiosis Institute of Technology", "B.Tech", "Information Technology"]),
  p("iOS developer passionate about Swift, SwiftUI and delightful mobile experiences.", ["Meesho", "iOS Developer", 4], ["Hotstar", "Mobile Engineer", 2], ["Manipal Institute of Technology", "B.Tech", "Computer Science"]),
  p("Machine learning engineer working on ranking, personalisation and model deployment.", ["Myntra", "Machine Learning Engineer", 4], ["Fractal Analytics", "Data Scientist", 2], ["IISc Bangalore", "M.Tech", "Artificial Intelligence"]),
  p("Embedded systems engineer building firmware for connected automotive products.", ["Bosch", "Embedded Systems Engineer", 5], ["L&T Technology Services", "Firmware Engineer", 3], ["College of Engineering Guindy", "B.E.", "Electronics and Communication"]),
  p("Developer advocate and technical writer making complex APIs easy to understand.", ["Postman", "Developer Advocate", 3], ["Hasura", "Technical Writer", 2], ["St. Xavier's College", "B.Sc.", "Computer Science"]),
  p("Tech founder building developer tools and SaaS products for engineering teams.", ["Buildkit Labs", "Founder & CEO", 2], ["Razorpay", "Software Engineer", 3], ["IIT Kharagpur", "B.Tech", "Computer Science and Engineering"]),
];

// two posts per user, index = user index
const postBodies = [
  ["Just shipped a major feature at work. The most satisfying part of engineering is seeing an idea turn into something people actually use.", "What are your favourite resources for learning system design? Looking for practical material rather than just theory."],
  ["Spent the week improving our design system. Small refinements to spacing, typography and components make a huge difference.", "Design question: when starting a new product, do you begin with user flows or visual direction?"],
  ["Built a small Next.js + Node.js application this weekend. The developer experience with modern React keeps getting better.", "MongoDB aggregation pipelines are incredibly powerful once you learn how to compose them properly."],
  ["Data is most useful when it leads to a decision. A beautiful dashboard means little if nobody knows what action to take.", "Exploring practical applications of machine learning in recommendation systems this quarter."],
  ["Finally cleaned up our CI/CD pipeline. Faster deployments and fewer manual steps already feel amazing.", "Kubernetes makes much more sense once you understand the problems it was built to solve."],
  ["Responsive design is not just making things smaller. Good mobile experiences often need different interaction patterns.", "Accessibility belongs in the design process from day one, not as a pre-launch checklist."],
  ["Optimised an API today that was making far more database queries than necessary. Profiling first saved hours.", "Indexes seem simple until production traffic arrives. Measure, then index."],
  ["Great research session today. Watching someone use a product without any guidance is incredibly valuable.", "The best product decisions combine quantitative data with qualitative research."],
  ["LLM applications are moving fast. I'm most interested in evaluation, reliability and making AI features genuinely useful.", "Started experimenting with retrieval augmented generation for internal knowledge systems."],
  ["A strong product roadmap explains not only what we are building, but why it matters.", "Working closely with engineering and design remains the best part of product management."],
  ["The best engineering managers remove obstacles and create clarity. Everything else follows from that.", "Hiring tip: structured interviews with clear rubrics reduce bias and improve signal."],
  ["Flaky tests erode trust in the whole pipeline. We cut ours by 80% by fixing root causes rather than adding retries.", "Quality is a team responsibility. QA's job is to make that responsibility easy to share."],
  ["Reminder: enable multi-factor authentication everywhere, especially on developer and cloud accounts.", "Threat modelling early in the design phase is far cheaper than patching after launch."],
  ["Migrated our app screens to Jetpack Compose. Less boilerplate, faster iteration and much easier previews.", "Android performance tip: profile startup time before optimising anything else."],
  ["Designing for failure is the core of cloud architecture. Assume every dependency will go down eventually.", "Cost optimisation is an architecture problem, not just a billing problem."],
  ["Hiring engineers? Be transparent about the role, the team and the interview process. Candidates notice.", "Great recruiting is relationship building, long before there is an open position."],
  ["Good SLOs turn vague reliability goals into engineering decisions the whole team can reason about.", "Blameless post-incident reviews build a culture where problems surface early."],
  ["Data quality checks at ingestion save countless hours of debugging downstream dashboards.", "Spent the week moving a batch pipeline to incremental processing. Cost and latency both dropped."],
  ["Enterprises don't need more tools, they need clearer data architecture and ownership.", "Spoke with customers this week about governance in modern data platforms. Trust is the foundation."],
  ["Clear requirements are a deliverable in their own right. Ambiguity is the most expensive bug.", "Good analysis ends with a recommendation, not just a report."],
  ["SwiftUI keeps maturing. State management is still where most of the complexity hides.", "Smooth animations and fast launch times are what make mobile apps feel premium."],
  ["Model deployment is where most ML projects succeed or fail. Monitoring matters as much as accuracy.", "Experimenting with embeddings to improve search relevance on our catalogue."],
  ["Firmware bugs are expensive to fix after release. Hardware-in-the-loop testing pays for itself.", "Embedded systems teach you to respect every byte and every millisecond."],
  ["Good documentation is a product. Treat examples, error messages and quickstarts with the same care as code.", "The best API docs answer the question the developer has right now, in under a minute."],
  ["Building developer tools means obsessing over the first five minutes. If setup is painful, nothing else matters.", "Early-stage lesson: talk to ten more customers before writing the next line of code."],
];

const postsData = postBodies.flatMap((bodies, user) =>
  bodies.map((body) => ({ user, body }))
);

const commentsText = [
  "Great perspective, thanks for sharing this.",
  "Completely agree. This matches my experience as well.",
  "This is really useful. Bookmarking it for later.",
  "Well said. Clarity like this is rare.",
  "Interesting approach. Would love to hear how it worked out in practice.",
  "Very relevant, we are tackling something similar on our team.",
  "Congratulations on the milestone!",
  "Excellent point. Measuring first is underrated.",
  "Thanks for the insight. Any resources you would recommend?",
  "Strong advice, especially for people early in their careers.",
  "This is a great discussion starter.",
  "Nicely put. Looking forward to more posts like this.",
  "Absolutely true. Fundamentals matter more than tools.",
  "Appreciate you sharing the lessons learned.",
];

// Deterministic, deduplicated connection graph: each user links to i+1, i+2 and i+5 (wrapping)
const buildConnectionPairs = (count) => {
  const seen = new Set();
  const pairs = [];
  for (let i = 0; i < count; i++) {
    for (const step of [1, 2, 5]) {
      const j = (i + step) % count;
      const key = [Math.min(i, j), Math.max(i, j)].join("-");
      if (i !== j && !seen.has(key)) {
        seen.add(key);
        pairs.push([i, j]);
      }
    }
  }
  return pairs;
};

// ================= IMAGE SOURCES =================
// Real photographs from Unsplash (free licence), no AI-generated images.
// Every image has fallbacks, so one dead link never breaks the seed.

const UNSPLASH = "https://images.unsplash.com/photo-";

// Professional headshots. Even user index = man, odd user index = woman (matches usersData order)
const MEN_PHOTOS = [
  "1507003211169-0a1dd7228f2d", "1500648767791-00dcc994a43e", "1472099645785-5658abf4ff4e",
  "1519085360753-af0119f7cbe7", "1560250097-0b93528c311a", "1506794778202-cad84cf45f1d",
  "1531427186611-ecfd6d936c79", "1568602471122-7832951cc4c5", "1463453091185-61582044d556",
  "1492562080023-ab3db95bfbce", "1552058544-f2b08422138a", "1557862921-37829c790f19",
  "1566492031773-4f4e44671857",
];
const WOMEN_PHOTOS = [
  "1494790108377-be9c29b29330", "1438761681033-6461ffad8d80", "1544005313-94ddf0286df2",
  "1573496359142-b8d87734a5a2", "1580489944761-15a19d654956", "1534528741775-53994a69daeb",
  "1573497019940-1c28c88b4f3e", "1487412720507-e7ab37603c6f", "1508214751196-bcfd4ca60f91",
  "1517841905240-472988babdf9", "1544725176-7c40e5a71c5e", "1524504388940-b1c1722653e1",
];

// High quality tech / workplace photos grouped by topic
const POST_IMAGES = {
  code: ["1498050108023-c5249f4df085", "1461749280684-dccba630e2f6", "1555066931-4365d14bab8c", "1542831371-29b0f74f9713"],
  design: ["1561070791-2526d30994b5", "1558655146-9f40138edfeb", "1522542550221-31fd19575a2d"],
  data: ["1551288049-bebda4e38f71", "1460925895917-afdab827c52f", "1504868584819-f8e8b4b6d7e3"],
  infra: ["1558494949-ef010cbdcc31", "1451187580459-43490279c0fa", "1544197150-b99a580bb7a8"],
  security: ["1550751827-4bd374c3f58b", "1563986768609-322da13575f3", "1526374965328-7f61d4dc18c5"],
  mobile: ["1512941937669-90a1b58e7e9c", "1555774698-0b77e0d5fac6", "1551650975-87deedd944c3"],
  ai: ["1485827404703-89b55fcc595e", "1677442136019-21780ecad995", "1555255707-c07966088b7b"],
  team: ["1522071820081-009f0129c71c", "1531482615713-2afd69097998", "1519389950473-47ba0277781c", "1553877522-43269d4ea984"],
  business: ["1454165804606-c3d57bc86b40", "1507679799987-c73779587ccf", "1556761175-5973dc0f32e7"],
  hardware: ["1518770660439-4636190af475", "1555664424-778a1e5e1b48", "1581092160562-40aa08e78837"],
  writing: ["1499750310107-5fef28a66643", "1455390582262-044cdead277a", "1488190211105-8b0e65b80b4e"],
};

// Topic per user (same order as usersData)
const USER_CATEGORY = [
  "code", "design", "code", "data", "infra", "code", "infra", "team", "ai",
  "business", "team", "code", "security", "mobile", "infra", "team", "infra", "data",
  "infra", "business", "mobile", "ai", "hardware", "writing", "code",
];

const avatarUrls = (i) => {
  const men = i % 2 === 0;
  const pool = men ? MEN_PHOTOS : WOMEN_PHOTOS;
  const id = pool[Math.floor(i / 2) % pool.length];
  return [
    `${UNSPLASH}${id}?auto=format&fit=crop&crop=faces&w=600&h=600&q=85`,
    // fallback: real portrait photo of the matching gender
    `https://randomuser.me/api/portraits/${men ? "men" : "women"}/${(i * 3 + 11) % 90}.jpg`,
  ];
};

const postImageUrls = (i, userIndex) => {
  const category = USER_CATEGORY[userIndex];
  const pool = POST_IMAGES[category];
  const id = pool[i % pool.length];
  return [
    `${UNSPLASH}${id}?auto=format&fit=crop&w=1600&q=80`,
    `https://loremflickr.com/1600/1000/${category === "infra" ? "server" : category}?lock=${i + 1}`,
  ];
};

// ================= IMAGE HELPERS =================

// tries each URL in order until one returns a real image
const downloadFirstWorking = async (urls, dest) => {
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      const type = res.headers.get("content-type") || "";
      if (!res.ok || !type.startsWith("image/")) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 5000) throw new Error("image too small");
      fs.writeFileSync(dest, buffer);
      return true;
    } catch (err) {
      console.warn(`  source failed (${err.message}), trying next`);
    }
  }
  return false;
};

const resolveImage = async (urls, filename, fallback, dir) => {
  if (IMAGE_MODE === "url") return urls[0];
  fs.mkdirSync(dir, { recursive: true });
  const ok = await downloadFirstWorking(urls, path.join(dir, filename));
  if (!ok) {
    console.warn(`Image skipped: ${filename}`);
    return fallback;
  }
  return filename;
};

// runs async jobs in small batches to stay polite to the image servers
const resolveAll = async (jobs, size = 5) => {
  const results = [];
  for (let i = 0; i < jobs.length; i += size) {
    results.push(...(await Promise.all(jobs.slice(i, i + size).map((job) => job()))));
  }
  return results;
};

// ================= SEED SCRIPT =================

const seed = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    await mongoose.connect(MONGO_URI);

    console.log("Connected to MongoDB");

    // --------------------------------
    // 1. CLEAR EXISTING DATA
    // --------------------------------

    await Promise.all([
      User.deleteMany({}),
      Profile.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      Connection.deleteMany({}),
    ]);

    console.log("Existing data cleared");

    // --------------------------------
    // 2. CREATE USERS
    // --------------------------------

    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    console.log("Downloading profile pictures...");

    const avatarFiles = await resolveAll(
      usersData.map((user, i) => () =>
        resolveImage(avatarUrls(i), `avatar-${user.username}.jpg`, "default.jpg", PROFILE_DIR)
      )
    );

    const users = await User.insertMany(
      usersData.map((user, index) => ({
        ...user,
        profilePicture: avatarFiles[index],
        password: hashedPassword,
        active: true,
        resume: "",
        token: "",
      }))
    );

    console.log(`${users.length} users created`);

    // --------------------------------
    // 3. CREATE PROFILES
    // --------------------------------

    const profiles = await Profile.insertMany(
      profilesData.map((profile, index) => ({
        userId: users[index]._id,
        ...profile,
      }))
    );

    console.log(`${profiles.length} profiles created`);

    // --------------------------------
    // 4. CREATE POSTS
    // --------------------------------

    console.log("Downloading post images...");

    // every third post stays text-only, the rest get an image
    const postFiles = await resolveAll(
      postsData.map((data, i) => () =>
        i % 3 === 2
          ? Promise.resolve("")
          : resolveImage(postImageUrls(i, data.user), `post-${i + 1}.jpg`, "", UPLOADS_DIR)
      )
    );

    const posts = [];

    for (let i = 0; i < postsData.length; i++) {
      const data = postsData[i];

      const daysAgo = (i % 30) + 1;

      const createdAt = new Date(
        Date.now() - daysAgo * 24 * 60 * 60 * 1000
      );

      posts.push({
        userId: users[data.user]._id,
        body: data.body,
        likes: [],
        createdAt,
        updatedAt: createdAt,
        media: MEDIA_AS_ARRAY ? (postFiles[i] ? [postFiles[i]] : []) : postFiles[i],
        active: true,
        filetype: postFiles[i] ? POST_FILETYPE : "",
      });
    }

    const createdPosts = await Post.insertMany(posts);

    console.log(`${createdPosts.length} posts created`);

    // --------------------------------
    // 5. ADD LIKES
    // --------------------------------

    for (let i = 0; i < createdPosts.length; i++) {
      const post = createdPosts[i];

      const authorIndex = postsData[i].user;

      const likeCount = 3 + (i % 8); // 3 to 10 likes per post
      const likeIndexes = Array.from({ length: likeCount }, (_, k) =>
        (authorIndex + 1 + k * 2) % users.length
      ).filter((idx) => idx !== authorIndex);

      post.likes = likeIndexes.map((index) => users[index]._id);

      await post.save();
    }

    console.log("Likes added");

    // --------------------------------
    // 6. CREATE COMMENTS
    // --------------------------------

    const comments = [];

    for (let i = 0; i < createdPosts.length; i++) {
      const post = createdPosts[i];

      const authorIndex = postsData[i].user;

      for (let k = 1; k <= 3; k++) {
        const commenter = (authorIndex + k * 3) % users.length;

        comments.push({
          postId: post._id,
          userId: users[commenter]._id,
          body: commentsText[(i + k) % commentsText.length],
        });
      }
    }

    await Comment.insertMany(comments);

    console.log(`${comments.length} comments created`);

    // --------------------------------
    // 7. CREATE CONNECTIONS
    // --------------------------------

    const connectionPairs = buildConnectionPairs(users.length);

    const connections = connectionPairs.map(([userIndex, connectionIndex]) => ({
      userId: users[userIndex]._id,
      connectionId: users[connectionIndex]._id,
      status_accepted: true,
    }));

    await Connection.insertMany(connections);

    console.log(`${connections.length} connections created`);

    // --------------------------------
    // DONE
    // --------------------------------

    const imagePosts = postFiles.filter(Boolean).length;
    const realAvatars = avatarFiles.filter((f) => f !== "default.jpg").length;

    console.log("\n=================================");
    console.log("DATABASE SEEDED SUCCESSFULLY");
    console.log("=================================");
    console.log(`Users:       ${users.length} (${realAvatars} with profile photos)`);
    console.log(`Profiles:    ${profiles.length}`);
    console.log(`Posts:       ${createdPosts.length} (${imagePosts} with images)`);
    console.log(`Comments:    ${comments.length}`);
    console.log(`Connections: ${connections.length}`);
    console.log("=================================");
    console.log(`Login password for ALL users: ${PASSWORD}`);
    console.log("=================================\n");

    process.exit(0);
  } catch (error) {
    console.error("\nSEED FAILED:");
    console.error(error);

    process.exit(1);
  }
};

seed();