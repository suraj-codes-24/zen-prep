"""
Seed script: 60 GD topics across 5 categories.
Run: python seed_gd.py
"""
import models.user, models.subject, models.topic, models.subtopic
import models.question, models.interview_session, models.answer
import models.coding, models.communication, models.gd

from database import SessionLocal, engine, Base
from models.gd import GDTopic

Base.metadata.create_all(bind=engine)
db = SessionLocal()

existing_titles = {t.title for t in db.query(GDTopic.title).all()}

TOPICS = [
    # ── Technology (14) ──────────────────────────────────────────────────────
    {
        "title": "The Impact of AI and Machine Learning on Engineering",
        "category": "Technology", "difficulty": "medium",
        "description": "Discuss how AI and ML are transforming engineering fields, from design and analysis to manufacturing and optimization. Consider both opportunities and risks.",
    },
    {
        "title": "The Future of Sustainable Engineering in Addressing Climate Change",
        "category": "Technology", "difficulty": "medium",
        "description": "Explore the role of engineers in developing sustainable solutions like renewable energy, green infrastructure, and waste management to combat climate change.",
    },
    {
        "title": "Innovations in Robotics and Automation: Implications for the Workforce",
        "category": "Technology", "difficulty": "medium",
        "description": "Discuss advancements in robotics, automation, and cobots and their impact on efficiency, productivity, and job displacement across industries.",
    },
    {
        "title": "The Internet of Things (IoT) and Its Impact on Industry",
        "category": "Technology", "difficulty": "easy",
        "description": "Explore how IoT devices are enabling data collection, real-time control, and predictive maintenance in engineering and manufacturing domains.",
    },
    {
        "title": "Ethical Considerations in Emerging Technologies: AI and Biotechnology",
        "category": "Technology", "difficulty": "hard",
        "description": "Discuss the ethical dilemmas surrounding cutting-edge technologies like AI and gene editing, and the need for responsible innovation frameworks.",
    },
    {
        "title": "Cybersecurity Engineering: Protecting Critical Infrastructure and Data",
        "category": "Technology", "difficulty": "medium",
        "description": "Highlight the importance of cybersecurity in a hyper-connected world and the challenges engineers face in securing systems, networks, and critical data.",
    },
    {
        "title": "India's Semiconductor Mission: Realistic or Overambitious?",
        "category": "Technology", "difficulty": "hard",
        "description": "Evaluate India's push to build a domestic semiconductor ecosystem. Discuss feasibility, global competition, investment requirements, and geopolitical factors.",
    },
    {
        "title": "The Ethics of AI-Generated Art and Intellectual Property",
        "category": "Technology", "difficulty": "medium",
        "description": "Debate who owns AI-generated content, whether training on existing art is ethical, and how copyright law should adapt to generative AI.",
    },
    {
        "title": "5G and Beyond: Opportunities and Risks for Society",
        "category": "Technology", "difficulty": "easy",
        "description": "Discuss how 5G networks will transform industries, smart cities, and connectivity, while addressing concerns around health, privacy, and digital divide.",
    },
    {
        "title": "Should Autonomous Vehicles Replace Human Drivers?",
        "category": "Technology", "difficulty": "easy",
        "description": "Debate the readiness, safety, ethics, and regulatory challenges of replacing human-driven vehicles with autonomous systems on public roads.",
    },
    {
        "title": "Open Source vs Proprietary Software: Which Model Wins?",
        "category": "Technology", "difficulty": "easy",
        "description": "Compare the open-source and proprietary software development models in terms of innovation, security, sustainability, and business viability.",
    },
    {
        "title": "Quantum Computing: Threat or Opportunity for Cybersecurity?",
        "category": "Technology", "difficulty": "hard",
        "description": "Analyze how quantum computing will break existing encryption standards, create new security challenges, and enable new cryptographic approaches.",
    },
    {
        "title": "Space Commercialization: Should Private Companies Lead Space Exploration?",
        "category": "Technology", "difficulty": "medium",
        "description": "Discuss whether private companies like SpaceX and Blue Origin should drive space exploration, the risks of commercializing space, and public vs private funding.",
    },
    {
        "title": "Digital Twins: Transforming Manufacturing and Urban Planning",
        "category": "Technology", "difficulty": "hard",
        "description": "Explore how digital twin technology creates virtual replicas of physical systems to optimize performance, predict failures, and simulate scenarios in real time.",
    },

    # ── Business (12) ────────────────────────────────────────────────────────
    {
        "title": "Remote Work vs Office Work: The Future of Corporate Culture",
        "category": "Business", "difficulty": "easy",
        "description": "Debate the pros and cons of hybrid and remote work models versus traditional office culture. Consider productivity, collaboration, and employee well-being.",
    },
    {
        "title": "Impact of Central Bank Digital Currencies on Global Banking",
        "category": "Business", "difficulty": "hard",
        "description": "Analyze how CBDCs could reshape monetary policy, financial inclusion, banking sector competition, and international trade settlement systems.",
    },
    {
        "title": "Startups vs Established Corporations: Who Drives True Innovation?",
        "category": "Business", "difficulty": "medium",
        "description": "Explore whether startups with agility and risk appetite or established corporations with resources and scale are better positioned to drive meaningful innovation.",
    },
    {
        "title": "The Gig Economy: Opportunity or Exploitation?",
        "category": "Business", "difficulty": "medium",
        "description": "Examine the gig economy's growth, debating whether platform-based work empowers workers with flexibility or exploits them through lack of benefits and job security.",
    },
    {
        "title": "ESG Investing: Genuine Change or Corporate Greenwashing?",
        "category": "Business", "difficulty": "hard",
        "description": "Debate whether ESG (Environmental, Social, Governance) investing drives real corporate responsibility or is primarily a marketing strategy to attract capital.",
    },
    {
        "title": "Should Tech Giants Be Broken Up to Prevent Monopolies?",
        "category": "Business", "difficulty": "medium",
        "description": "Discuss antitrust action against large tech companies, the argument for breaking up monopolies, and the impact on innovation, competition, and consumers.",
    },
    {
        "title": "The Future of Retail: Can Brick-and-Mortar Survive E-Commerce?",
        "category": "Business", "difficulty": "easy",
        "description": "Analyze how traditional retail is adapting to compete with e-commerce giants, and whether physical stores can thrive by offering unique experiences.",
    },
    {
        "title": "Subscription Economy: Is Owning Products Becoming Obsolete?",
        "category": "Business", "difficulty": "easy",
        "description": "Explore the shift from owning products to subscribing to services, and debate the long-term implications for consumers, businesses, and sustainability.",
    },
    {
        "title": "Supply Chain Resilience: Lessons from Global Disruptions",
        "category": "Business", "difficulty": "medium",
        "description": "Examine how global events exposed vulnerabilities in just-in-time supply chains and what strategies companies should adopt to build resilience.",
    },
    {
        "title": "Impact of Inflation on Emerging Market Economies",
        "category": "Business", "difficulty": "hard",
        "description": "Discuss how rising global inflation affects developing economies differently from developed ones, including currency depreciation, debt burdens, and policy responses.",
    },
    {
        "title": "Is the Four-Day Work Week the Future of Productivity?",
        "category": "Business", "difficulty": "easy",
        "description": "Debate the evidence for and against a four-day workweek, examining its effects on employee productivity, well-being, and organizational efficiency.",
    },
    {
        "title": "Venture Capital's Role in Shaping the Tech Ecosystem",
        "category": "Business", "difficulty": "hard",
        "description": "Analyze how VC funding drives innovation, creates unicorn companies, and shapes which technologies get built, while discussing downsides like short-termism.",
    },

    # ── Society (12) ─────────────────────────────────────────────────────────
    {
        "title": "Social Media's Impact on Mental Health and Productivity",
        "category": "Society", "difficulty": "easy",
        "description": "Analyze how excessive social media use affects mental health, attention spans, and productivity, especially in students and young professionals.",
    },
    {
        "title": "Should Coding Be a Mandatory Subject in Schools?",
        "category": "Society", "difficulty": "easy",
        "description": "Debate whether programming should be a core curriculum subject alongside math and science, and how this would prepare students for a tech-driven future.",
    },
    {
        "title": "Technology and the Future of Healthcare: Opportunities and Risks",
        "category": "Society", "difficulty": "medium",
        "description": "Discuss how AI diagnostics, telemedicine, wearables, and genomics are revolutionizing healthcare while raising concerns around privacy, equity, and doctor-patient relationships.",
    },
    {
        "title": "Is College Education Still Worth the Investment?",
        "category": "Society", "difficulty": "easy",
        "description": "Debate the value of a traditional college degree in an age of online learning, bootcamps, and skill-based hiring, considering ROI, career outcomes, and social mobility.",
    },
    {
        "title": "Gender Pay Gap: Is It Still a Structural Problem?",
        "category": "Society", "difficulty": "medium",
        "description": "Discuss the causes and persistence of the gender pay gap, examine evidence on structural bias versus individual choices, and debate policy interventions.",
    },
    {
        "title": "The Digital Divide: Technology Inclusion as a Human Right",
        "category": "Society", "difficulty": "medium",
        "description": "Explore how unequal access to technology deepens inequality, and debate whether internet access and digital literacy should be recognized as fundamental rights.",
    },
    {
        "title": "Misinformation and Fake News: Who Is Responsible?",
        "category": "Society", "difficulty": "medium",
        "description": "Discuss the role of social media platforms, governments, and individuals in combating misinformation, and the tension between free speech and content moderation.",
    },
    {
        "title": "Should Reservation Systems Be Replaced with Economic-Based Affirmative Action?",
        "category": "Society", "difficulty": "hard",
        "description": "Debate whether caste-based reservations should evolve into economically targeted affirmative action, examining equity, merit, and the political dimensions.",
    },
    {
        "title": "Urbanization vs Rural Development: Where Should Investment Go?",
        "category": "Society", "difficulty": "medium",
        "description": "Debate whether governments should prioritize urban infrastructure and smart cities or invest in rural development to reduce migration and regional inequality.",
    },
    {
        "title": "Impact of Video Games on Youth: Entertainment or Harm?",
        "category": "Society", "difficulty": "easy",
        "description": "Examine both sides of the debate on video games — cognitive benefits, social skills, and creativity vs addiction, violence, and academic impact.",
    },
    {
        "title": "Should the Legal Drinking and Voting Age Be Aligned?",
        "category": "Society", "difficulty": "easy",
        "description": "Debate the consistency (or lack thereof) in age-based legal thresholds for voting, drinking, and other responsibilities, and what they imply about society's view of adulthood.",
    },
    {
        "title": "Celebrity Culture and Its Influence on Public Values",
        "category": "Society", "difficulty": "easy",
        "description": "Analyze how celebrity influence shapes public opinion, consumer behavior, and social values, and whether this influence is net positive or negative.",
    },

    # ── Policy (10) ──────────────────────────────────────────────────────────
    {
        "title": "Data Privacy in the Age of AI and Mass Surveillance",
        "category": "Policy", "difficulty": "hard",
        "description": "Examine the tension between leveraging data for social good and protecting individual privacy, and the role of governments in regulating data collection and AI systems.",
    },
    {
        "title": "Universal Basic Income: A Solution to Automation-Driven Unemployment?",
        "category": "Policy", "difficulty": "hard",
        "description": "Debate whether UBI is a viable policy response to job displacement caused by automation and AI, considering economic feasibility, social impact, and behavioral effects.",
    },
    {
        "title": "Should Social Media Platforms Be Regulated Like Public Utilities?",
        "category": "Policy", "difficulty": "medium",
        "description": "Debate whether platforms like Meta and X should be regulated as public utilities, with obligations around access, neutrality, and accountability.",
    },
    {
        "title": "Nuclear Energy: The Answer to the Climate Crisis?",
        "category": "Policy", "difficulty": "medium",
        "description": "Discuss whether nuclear power should play a larger role in the global energy mix to achieve net-zero targets, balancing safety concerns, costs, and waste management.",
    },
    {
        "title": "Should Governments Tax Wealth More Heavily Than Income?",
        "category": "Policy", "difficulty": "hard",
        "description": "Debate the case for wealth taxes versus income taxes in addressing inequality, examining economic efficiency, capital flight risks, and distributional impact.",
    },
    {
        "title": "Drug Decriminalization: Public Health Approach vs Law Enforcement",
        "category": "Policy", "difficulty": "hard",
        "description": "Discuss whether decriminalizing drug possession reduces harm, comparing outcomes from countries that have tried the approach against traditional law enforcement models.",
    },
    {
        "title": "Should Voting Be Made Compulsory?",
        "category": "Policy", "difficulty": "easy",
        "description": "Debate the merits of mandatory voting systems in strengthening democratic legitimacy, and the tensions with individual freedom and civic responsibility.",
    },
    {
        "title": "Climate Reparations: Should Developed Nations Pay Developing Countries?",
        "category": "Policy", "difficulty": "hard",
        "description": "Debate whether historically high-emitting developed nations have a moral and legal obligation to fund climate adaptation in developing countries most affected by climate change.",
    },
    {
        "title": "Should Hate Speech Be Legally Defined and Prosecuted?",
        "category": "Policy", "difficulty": "medium",
        "description": "Explore the balance between free speech protections and the need to legislate against incitement to hatred, examining definitions, enforcement, and international models.",
    },
    {
        "title": "Right to Be Forgotten: Privacy vs Public Interest on the Internet",
        "category": "Policy", "difficulty": "medium",
        "description": "Debate whether individuals should have the legal right to have online information about them removed, balancing personal privacy against press freedom and public interest.",
    },

    # ── Abstract (12) ────────────────────────────────────────────────────────
    {
        "title": "Is Failure Necessary for Success?",
        "category": "Abstract", "difficulty": "easy",
        "description": "Explore whether experiencing failure is a prerequisite for meaningful success, or whether it is possible to achieve great outcomes through careful planning and execution alone.",
    },
    {
        "title": "Should Individuality Be Valued Over Conformity?",
        "category": "Abstract", "difficulty": "easy",
        "description": "Debate the tension between individual expression and social conformity, and when each is more valuable — in workplaces, schools, families, or society at large.",
    },
    {
        "title": "Is Technology Making Us Less Human?",
        "category": "Abstract", "difficulty": "medium",
        "description": "Discuss whether our increasing reliance on technology is eroding distinctly human qualities like empathy, creativity, patience, and deep relationships.",
    },
    {
        "title": "Can Money Buy Happiness?",
        "category": "Abstract", "difficulty": "easy",
        "description": "Examine the relationship between wealth and well-being — where money helps, where it does not, and what truly drives human happiness beyond a basic standard of living.",
    },
    {
        "title": "Is Ambition a Virtue or a Vice?",
        "category": "Abstract", "difficulty": "medium",
        "description": "Explore whether ambition drives human progress or leads to greed, exploitation, and personal unhappiness — and how context shapes which it becomes.",
    },
    {
        "title": "Does Social Media Create More Division Than Unity?",
        "category": "Abstract", "difficulty": "medium",
        "description": "Debate whether social media platforms, despite connecting billions, ultimately increase polarization, echo chambers, and societal fragmentation.",
    },
    {
        "title": "Is Democracy the Best Form of Governance for the 21st Century?",
        "category": "Abstract", "difficulty": "hard",
        "description": "Critically evaluate democracy's strengths and weaknesses in addressing modern challenges like climate change, inequality, and geopolitical competition.",
    },
    {
        "title": "Should Art Have a Social Purpose or Exist for Its Own Sake?",
        "category": "Abstract", "difficulty": "medium",
        "description": "Debate whether art should aim to educate, critique, and drive social change — or whether it has intrinsic value independent of utility or moral purpose.",
    },
    {
        "title": "Is Privacy a Right or a Privilege in the Digital Age?",
        "category": "Abstract", "difficulty": "medium",
        "description": "Examine whether privacy can still be considered a universal right when so much of modern life requires surrendering personal data to access services and opportunities.",
    },
    {
        "title": "Do Leaders Shape History or Does History Create Leaders?",
        "category": "Abstract", "difficulty": "hard",
        "description": "Explore the great-man theory of history versus structural forces — do exceptional individuals change the course of events, or do circumstances produce whoever is needed?",
    },
    {
        "title": "Is Competition Healthier Than Collaboration?",
        "category": "Abstract", "difficulty": "easy",
        "description": "Debate whether competition drives better outcomes than collaboration in education, business, sports, and governance — or whether the two can coexist productively.",
    },
    {
        "title": "Truth vs Kindness: Which Should Take Priority in Communication?",
        "category": "Abstract", "difficulty": "easy",
        "description": "Examine situations where honesty and kindness conflict, and debate which value should guide communication in personal relationships, workplaces, and public discourse.",
    },
]

inserted = 0
for t in TOPICS:
    if t["title"] not in existing_titles:
        db.add(GDTopic(**t))
        inserted += 1

db.commit()
print(f"[GD Seed] Inserted {inserted} new topics. ({len(TOPICS) - inserted} already existed)")
db.close()
