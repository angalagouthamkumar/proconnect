import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

import User from "./models/user.model.js";
import Profile from "./models/profile.model.js";
import Post from "./models/posts.model.js";
import Comment from "./models/comments.model.js";
import Connection from "./models/connections.model.js";


dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.mongo_uri;

const PASSWORD = "Test@123";

// ================= SEED DATA =================


const usersData = [
  { name: "Aarav Mehta", username: "aaravmehta", email: "aarav@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Priya Sharma", username: "priyasharma", email: "priya@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Rohan Kapoor", username: "rohankapoor", email: "rohan@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Ananya Iyer", username: "ananyaiyer", email: "ananya@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Vikram Rao", username: "vikramrao", email: "vikram@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Neha Verma", username: "nehaverma", email: "neha@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Arjun Nair", username: "arjunnair", email: "arjun@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Kavya Reddy", username: "kavyareddy", email: "kavya@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Aditya Singh", username: "adityasingh", email: "aditya@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Meera Joshi", username: "meerajoshi", email: "meera@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Siddharth Malhotra", username: "siddharthmalhotra", email: "siddharth@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Ishita Banerjee", username: "ishitabanerjee", email: "ishita@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Karan Bhatia", username: "karanbhatia", email: "karan@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Divya Menon", username: "divyamenon", email: "divya@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Rahul Deshpande", username: "rahuldeshpande", email: "rahul@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Sneha Kulkarni", username: "snehakulkarni", email: "sneha@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Harsh Agarwal", username: "harshagarwal", email: "harsh@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Pooja Nambiar", username: "poojanambiar", email: "pooja@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Manish Gupta", username: "manishgupta", email: "manish@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Tanvi Choudhary", username: "tanvichoudhary", email: "tanvi@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Nikhil Pillai", username: "nikhilpillai", email: "nikhil@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Shreya Bhat", username: "shreyabhat", email: "shreya@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Yash Thakur", username: "yashthakur", email: "yash@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Riya Fernandes", username: "riyafernandes", email: "riya@proconnect.dev", profilePicture: "default.jpg" },
  { name: "Devansh Kulshreshtha", username: "devanshk", email: "devansh@proconnect.dev", profilePicture: "default.jpg" },
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
  p("Talent acquisition partner helping engineering teams hire and grow great people.", ["Zomato", "Talent Acquisition Partner", 5], ["Randstad", "Technical Recruiter", 3], ["Symbiosis Institute", "MBA", "Human Resources"]),
  p("Site reliability engineer focused on observability, SLOs and incident management.", ["Cisco", "Site Reliability Engineer", 5], ["Tech Mahindra", "Systems Engineer", 3], ["IIIT Hyderabad", "B.Tech", "Computer Science"]),
  p("Data engineer building scalable pipelines and trustworthy analytics platforms.", ["Walmart Global Tech", "Data Engineer", 4], ["LTIMindtree", "ETL Developer", 3], ["NIT Surathkal", "B.Tech", "Computer Science"]),
  p("Solutions architect helping enterprises modernise data and cloud platforms.", ["Snowflake", "Solutions Architect", 6], ["Deloitte", "Technology Consultant", 4], ["IIT Delhi", "M.Tech", "Computer Science"]),
  p("Business analyst translating complex requirements into clear, measurable outcomes.", ["Goldman Sachs", "Business Analyst", 3], ["EY", "Risk Analyst", 2], ["SRCC, Delhi University", "B.Com", "Economics"]),
  p("iOS developer passionate about Swift, SwiftUI and delightful mobile experiences.", ["Meesho", "iOS Developer", 4], ["Hotstar", "Mobile Engineer", 2], ["Manipal Institute of Technology", "B.Tech", "Computer Science"]),
  p("Machine learning engineer working on ranking, personalisation and model deployment.", ["Myntra", "Machine Learning Engineer", 4], ["Fractal Analytics", "Data Scientist", 2], ["IISc Bangalore", "M.Tech", "Artificial Intelligence"]),
  p("Embedded systems engineer building firmware for connected automotive products.", ["Bosch", "Embedded Systems Engineer", 5], ["L&T Technology Services", "Firmware Engineer", 3], ["College of Engineering Guindy", "B.E.", "Electronics and Communication"]),
  p("Developer advocate and technical writer making complex APIs easy to understand.", ["Postman", "Developer Advocate", 3], ["Hasura", "Technical Writer", 2], ["St. Xavier's College", "B.Sc.", "Computer Science"]),
  p("Founder building technology for agriculture, supply chains and rural markets.", ["AgriStack", "Founder & CEO", 2], ["Ninjacart", "Product Associate", 3], ["IIT Kharagpur", "B.Tech", "Agricultural Engineering"]),
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
  ["Building for farmers means designing for low bandwidth, local languages and trust, not just features.", "Early-stage lesson: talk to ten more customers before writing the next line of code."],
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

    const users = await User.insertMany(
      usersData.map((user) => ({
        ...user,
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
        media: [],
        active: true,
        filetype: "",
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

    console.log("\n=================================");
    console.log("DATABASE SEEDED SUCCESSFULLY");
    console.log("=================================");
    console.log(`Users:       ${users.length}`);
    console.log(`Profiles:    ${profiles.length}`);
    console.log(`Posts:       ${createdPosts.length}`);
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