export interface CuratedResource {
  title: string;
  description: string;
  url: string;
  tag: string;
}

export interface ResourceCategory {
  name: string;
  emoji: string;
  resources: CuratedResource[];
}

export const CURATED_CATEGORIES: ResourceCategory[] = [
  {
    name: "Engineering & Technology",
    emoji: "⚙️",
    resources: [
      { title: "NPTEL Engineering Courses", description: "Free IIT/IISc engineering courses with certification for all branches", url: "https://nptel.ac.in/", tag: "General" },
      { title: "MIT OCW Engineering", description: "Free MIT engineering lecture notes, assignments, and exams", url: "https://ocw.mit.edu/search/?d=Engineering", tag: "General" },
      { title: "GeeksforGeeks CS Portal", description: "Free CS theory, DSA, OS, CN, DBMS notes and practice", url: "https://www.geeksforgeeks.org/", tag: "DSA" },
      { title: "Coursera Engineering (Free Audit)", description: "Free audit access to top engineering courses from global universities", url: "https://www.coursera.org/browse/engineering", tag: "General" },
      { title: "Gate Smashers – YouTube", description: "Free GATE and university exam lectures for CS and ECE", url: "https://www.youtube.com/@GateSmashersOfficial", tag: "General" },
    ],
  },
  {
    name: "Computer Science & AI/ML",
    emoji: "🤖",
    resources: [
      { title: "fast.ai Deep Learning", description: "Free practical deep learning course for coders, top-down approach", url: "https://course.fast.ai/", tag: "AI/ML" },
      { title: "Google ML Crash Course", description: "Free machine learning course with TensorFlow by Google", url: "https://developers.google.com/machine-learning/crash-course", tag: "AI/ML" },
      { title: "Hugging Face NLP Course", description: "Free NLP and LLM course using Transformers library", url: "https://huggingface.co/learn/nlp-course", tag: "AI/ML" },
      { title: "CS50 Harvard – Free", description: "Harvard's legendary intro to computer science, 100% free", url: "https://cs50.harvard.edu/x/", tag: "General" },
      { title: "Kaggle Learn", description: "Free bite-sized ML, Python, SQL, and data science courses", url: "https://www.kaggle.com/learn", tag: "AI/ML" },
    ],
  },
  {
    name: "DSA & Competitive Programming",
    emoji: "🧮",
    resources: [
      { title: "Striver's A2Z DSA Sheet", description: "Complete 191-problem DSA roadmap for placements by TakeUForward", url: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/", tag: "DSA" },
      { title: "W3Schools DSA Tutorial", description: "Interactive DSA learning with animations and quizzes", url: "https://www.w3schools.com/dsa/", tag: "DSA" },
      { title: "OpenDSA – Virginia Tech", description: "Free interactive DSA textbook with visualizations", url: "https://opendsa-server.cs.vt.edu/", tag: "DSA" },
      { title: "LeetCode Free Problems", description: "Free coding interview practice with 2000+ problems", url: "https://leetcode.com/", tag: "DSA" },
      { title: "CP-Algorithms", description: "Free competitive programming algorithms reference and tutorials", url: "https://cp-algorithms.com/", tag: "DSA" },
    ],
  },
  {
    name: "Business Management & MBA",
    emoji: "📊",
    resources: [
      { title: "Harvard Business Review (Free)", description: "Free HBR articles on management, leadership, and strategy", url: "https://hbr.org/", tag: "Commerce" },
      { title: "Coursera Business (Free Audit)", description: "Free audit access to MBA-level business courses from top universities", url: "https://www.coursera.org/browse/business", tag: "Commerce" },
      { title: "MIT OCW Management", description: "Free MIT Sloan management and business course materials", url: "https://ocw.mit.edu/search/?d=Sloan+School+of+Management", tag: "Commerce" },
      { title: "Investopedia Business", description: "Free business, finance, and management concepts explained clearly", url: "https://www.investopedia.com/business-4427749", tag: "Commerce" },
      { title: "edX Business Courses (Audit Free)", description: "Free audit access to business, marketing, and strategy courses", url: "https://www.edx.org/learn/business", tag: "Commerce" },
    ],
  },
  {
    name: "Commerce & Accounting",
    emoji: "💰",
    resources: [
      { title: "ICAI Study Material (Free)", description: "Free CA Foundation and Intermediate study material by ICAI", url: "https://www.icai.org/post/study-material", tag: "Commerce" },
      { title: "AccountingCoach (Free)", description: "Free accounting lessons, quizzes, and reference guides", url: "https://www.accountingcoach.com/", tag: "Commerce" },
      { title: "Khan Academy Finance", description: "Free personal finance and accounting fundamentals by Khan Academy", url: "https://www.khanacademy.org/economics-finance-domain", tag: "Economics" },
      { title: "ClearTax Learning", description: "Free GST, income tax, and finance guides for Indian commerce students", url: "https://cleartax.in/learn", tag: "Commerce" },
      { title: "MyAccountingCourse", description: "Free accounting course notes, flashcards, and practice exams", url: "https://www.myaccountingcourse.com/", tag: "Commerce" },
    ],
  },
  {
    name: "Law & Legal Affairs",
    emoji: "⚖️",
    resources: [
      { title: "Indian Kanoon", description: "Free searchable database of all Indian court judgments and laws", url: "https://indiankanoon.org/", tag: "Law" },
      { title: "Legislative Department India", description: "Free access to all Indian Acts, Bills, and legal documents officially", url: "https://legislative.gov.in/", tag: "Law" },
      { title: "NALSAR Free Law Courses – Swayam", description: "Free law courses by NALSAR University on Swayam platform", url: "https://swayam.gov.in/explorer?searchText=law", tag: "Law" },
      { title: "Bar and Bench", description: "Free Indian legal news, judgments, and case analysis", url: "https://www.barandbench.com/", tag: "Law" },
      { title: "LII Legal Information Institute", description: "Free international legal encyclopedia and case law reference", url: "https://www.law.cornell.edu/", tag: "Law" },
    ],
  },
  {
    name: "Nursing & Allied Health Sciences",
    emoji: "🩺",
    resources: [
      { title: "Khan Academy Health & Medicine", description: "Free MCAT prep, anatomy, physiology, and medicine video lessons", url: "https://www.khanacademy.org/science/health-and-medicine", tag: "Medical" },
      { title: "Osmosis (Free Videos)", description: "Free medical and nursing education videos on diseases and pharmacology", url: "https://www.osmosis.org/", tag: "Medical" },
      { title: "NursingWorld – ANA Resources", description: "Free nursing practice resources and standards from ANA", url: "https://www.nursingworld.org/", tag: "Medical" },
      { title: "NCBI PubMed Free Articles", description: "Free access to millions of biomedical and nursing research papers", url: "https://pubmed.ncbi.nlm.nih.gov/", tag: "Medical" },
      { title: "RegisteredNurseRN – YouTube", description: "Free nursing exam prep videos covering NCLEX and clinical topics", url: "https://www.youtube.com/@RegisteredNurseRN", tag: "Medical" },
    ],
  },
  {
    name: "Pharmacy",
    emoji: "💊",
    resources: [
      { title: "PharmaXChange (Free)", description: "Free pharmacy study notes, drug information, and clinical resources", url: "https://pharmaxchange.info/", tag: "Medical" },
      { title: "PubChem – NIH Free DB", description: "Free NIH database for chemical and drug compound information", url: "https://pubchem.ncbi.nlm.nih.gov/", tag: "Medical" },
      { title: "NPTEL Pharmaceutical Courses", description: "Free IIT pharmacy and pharmaceutical sciences courses", url: "https://nptel.ac.in/course.html", tag: "Medical" },
      { title: "WHO Essential Medicines (Free)", description: "Free WHO resources on essential medicines and pharmacology", url: "https://www.who.int/groups/expert-committee-on-selection-and-use-of-essential-medicines", tag: "Medical" },
      { title: "Pharmacology Education Project", description: "Free pharmacology learning resources and lecture notes", url: "https://www.pharmacologyeducation.org/", tag: "Medical" },
    ],
  },
  {
    name: "Sciences (Physics, Chemistry, Biology)",
    emoji: "🔬",
    resources: [
      { title: "Khan Academy Sciences", description: "Free physics, chemistry, and biology from basics to advanced", url: "https://www.khanacademy.org/science", tag: "General" },
      { title: "NCERT Textbooks Free PDFs", description: "Free NCERT science textbooks for Classes 6-12 in PDF format", url: "https://ncert.nic.in/textbook.php", tag: "General" },
      { title: "MIT OCW Science Courses", description: "Free MIT science course materials, labs, and lecture notes", url: "https://ocw.mit.edu/search/?d=Science", tag: "General" },
      { title: "LibreTexts Sciences", description: "Free open-access science textbooks for chemistry, biology, physics", url: "https://libretexts.org/", tag: "General" },
      { title: "Crash Course Sciences – YouTube", description: "Free science video series: physics, chemistry, biology, astronomy", url: "https://www.youtube.com/@crashcourse", tag: "General" },
    ],
  },
  {
    name: "Mathematics & Statistics",
    emoji: "📐",
    resources: [
      { title: "Khan Academy Math", description: "Free math from algebra to calculus, linear algebra, statistics", url: "https://www.khanacademy.org/math", tag: "Math" },
      { title: "Paul's Online Math Notes", description: "Free complete notes for Calculus 1/2/3, Linear Algebra, Diff Equations", url: "https://tutorial.math.lamar.edu/", tag: "Math" },
      { title: "MIT OCW Mathematics", description: "Free MIT math courses: calculus, probability, number theory", url: "https://ocw.mit.edu/search/?d=Mathematics", tag: "Math" },
      { title: "3Blue1Brown – YouTube", description: "Beautiful visual math explanations: linear algebra, calculus, statistics", url: "https://www.youtube.com/@3blue1brown", tag: "Math" },
      { title: "StatQuest – YouTube", description: "Free statistics and ML concepts explained simply by Josh Starmer", url: "https://www.youtube.com/@statquest", tag: "Math" },
    ],
  },
  {
    name: "Economics",
    emoji: "💹",
    resources: [
      { title: "Marginal Revolution University", description: "Free economics video courses by professors Cowen and Tabarrok", url: "https://mru.org/", tag: "Economics" },
      { title: "MIT OCW Economics", description: "Free MIT undergraduate and graduate economics course materials", url: "https://ocw.mit.edu/search/?d=Economics", tag: "Economics" },
      { title: "RBI Financial Education", description: "RBI's free financial literacy and economics resources for students", url: "https://www.rbi.org.in/Scripts/FS_FinancialEducation.aspx", tag: "Economics" },
      { title: "IMF Free Learning", description: "Free IMF online courses on macroeconomics and financial policy", url: "https://www.edx.org/school/imf", tag: "Economics" },
      { title: "Investopedia Economics", description: "Free economics concepts, theories, and terminology explained", url: "https://www.investopedia.com/economics-4689800", tag: "Economics" },
    ],
  },
  {
    name: "Psychology",
    emoji: "🧠",
    resources: [
      { title: "Crash Course Psychology – YouTube", description: "40-episode free psychology video series covering all major topics", url: "https://www.youtube.com/playlist?list=PL8dPuuaLjXtOPRKzVLY0jJY-uHOH9KVU6", tag: "Psychology" },
      { title: "Simply Psychology", description: "Free psychology study guides, revision notes, and research summaries", url: "https://www.simplypsychology.org/", tag: "Psychology" },
      { title: "Khan Academy AP Psychology", description: "Free AP Psychology lessons covering all major theories and topics", url: "https://www.khanacademy.org/science/ap-psychology", tag: "Psychology" },
      { title: "Coursera Psychology (Free Audit)", description: "Free audit to top psychology courses from Yale, Michigan, and more", url: "https://www.coursera.org/browse/social-sciences/psychology", tag: "Psychology" },
      { title: "Noba Project (Free Textbook)", description: "Free open-source psychology textbook used by global universities", url: "https://nobaproject.com/", tag: "Psychology" },
    ],
  },
  {
    name: "Liberal Arts & Humanities",
    emoji: "📚",
    resources: [
      { title: "MIT OCW Humanities", description: "Free MIT humanities courses: history, literature, philosophy, and arts", url: "https://ocw.mit.edu/search/?d=Humanities", tag: "General" },
      { title: "Coursera Arts & Humanities (Free Audit)", description: "Free audit access to humanities courses from top universities", url: "https://www.coursera.org/browse/arts-and-humanities", tag: "General" },
      { title: "Project Gutenberg", description: "Free 70,000+ classic literature books in public domain", url: "https://www.gutenberg.org/", tag: "General" },
      { title: "Internet Archive", description: "Free access to millions of books, films, music, and historical texts", url: "https://archive.org/", tag: "General" },
      { title: "Stanford Encyclopedia of Philosophy (Free)", description: "Free authoritative philosophy encyclopedia by Stanford University", url: "https://plato.stanford.edu/", tag: "General" },
    ],
  },
  {
    name: "Journalism & Mass Communication",
    emoji: "📰",
    resources: [
      { title: "Reuters Journalism Training (Free)", description: "Free journalism courses and training materials by Reuters Institute", url: "https://reutersinstitute.politics.ox.ac.uk/resources", tag: "General" },
      { title: "Knight Center Free Courses", description: "Free journalism and digital media courses by Knight Center UT Austin", url: "https://knightcenter.utexas.edu/en/courses/", tag: "General" },
      { title: "Coursera Journalism (Free Audit)", description: "Free audit access to journalism and media studies courses", url: "https://www.coursera.org/courses?query=journalism", tag: "General" },
      { title: "BBC Academy (Free)", description: "Free journalism, media skills, and storytelling resources by BBC", url: "https://www.bbc.co.uk/academy", tag: "General" },
      { title: "Poynter NewsU (Free Courses)", description: "Free online journalism training and ethics courses by Poynter", url: "https://www.poynter.org/newsu/", tag: "General" },
    ],
  },
  {
    name: "Education & Teaching",
    emoji: "🎒",
    resources: [
      { title: "NCERT Teacher Resources (Free)", description: "Free NCERT teaching materials, lesson plans, and pedagogy guides", url: "https://ncert.nic.in/", tag: "General" },
      { title: "Coursera Education (Free Audit)", description: "Free audit to education and teaching methodology courses", url: "https://www.coursera.org/browse/social-sciences/education", tag: "General" },
      { title: "edX Teacher Training (Free Audit)", description: "Free audit to teacher professional development courses", url: "https://www.edx.org/learn/teaching", tag: "General" },
      { title: "Khan Academy Teacher Resources", description: "Free classroom resources, lesson plans, and progress tracking tools", url: "https://www.khanacademy.org/teacher", tag: "General" },
      { title: "UNESCO Free Education Resources", description: "Free UNESCO open educational resources and global teaching tools", url: "https://www.unesco.org/en/open-educational-resources", tag: "General" },
    ],
  },
  {
    name: "Fine Arts & Design",
    emoji: "🎨",
    resources: [
      { title: "Canva Design School (Free)", description: "Free graphic design, branding, and visual storytelling courses", url: "https://www.canva.com/designschool/", tag: "Design" },
      { title: "Google UX Design – Coursera (Audit Free)", description: "Google's professional UX design certificate, free to audit", url: "https://www.coursera.org/professional-certificates/google-ux-design", tag: "Design" },
      { title: "Figma YouTube Channel (Free)", description: "Free Figma UI/UX design tutorials for complete beginners", url: "https://www.youtube.com/c/Figma", tag: "Design" },
      { title: "Behance (Free Portfolio & Learning)", description: "Free creative inspiration and learning resources for all art forms", url: "https://www.behance.net/", tag: "Design" },
      { title: "Coursera Arts & Design (Free Audit)", description: "Free audit to visual arts, animation, and design courses globally", url: "https://www.coursera.org/browse/arts-and-humanities", tag: "Design" },
    ],
  },
  {
    name: "Research & Academic Writing",
    emoji: "🔍",
    resources: [
      { title: "Google Scholar", description: "Free search engine for scholarly articles, theses, and research papers", url: "https://scholar.google.com/", tag: "General" },
      { title: "arXiv.org", description: "Free preprint server for CS, AI, physics, math, and economics research", url: "https://arxiv.org/", tag: "AI/ML" },
      { title: "Shodhganga – Indian Theses (Free)", description: "Free repository of Indian PhD theses and research by INFLIBNET", url: "https://shodhganga.inflibnet.ac.in/", tag: "General" },
      { title: "Purdue OWL Writing Lab", description: "Free academic writing, citation guides for APA, MLA, Chicago", url: "https://owl.purdue.edu/", tag: "General" },
      { title: "Zotero Reference Manager (Free)", description: "Free tool to collect, organize, and cite academic research sources", url: "https://www.zotero.org/", tag: "General" },
    ],
  },
  {
    name: "Placement & Aptitude",
    emoji: "🎯",
    resources: [
      { title: "IndiaBIX Aptitude", description: "Free aptitude, reasoning, and verbal questions for placement prep", url: "https://www.indiabix.com/", tag: "General" },
      { title: "PrepInsta", description: "Free company-wise placement prep: aptitude, coding, HR questions", url: "https://prepinsta.com/", tag: "General" },
      { title: "HackerRank Free Certifications", description: "Free coding and skill certifications recognized by top companies", url: "https://www.hackerrank.com/", tag: "General" },
      { title: "Unstop Free Contests", description: "Free hackathons, quizzes, case competitions, and placement challenges", url: "https://unstop.com/", tag: "General" },
      { title: "Internshala Free Trainings", description: "Free skill training courses with certificates for Indian students", url: "https://trainings.internshala.com/", tag: "General" },
    ],
  },
];
