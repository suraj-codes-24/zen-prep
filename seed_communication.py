"""
Seed script: Communication test questions (140+ across 8 sections).
Run: python seed_communication.py
"""
import models.user, models.subject, models.topic, models.subtopic
import models.question, models.interview_session, models.answer
import models.coding, models.communication

from database import SessionLocal, engine, Base
from models.communication import CommQuestion

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Clear existing comm questions
db.query(CommQuestion).delete()
db.commit()

SECTION_NAMES = {
    "A": "Read Sentences",
    "B": "Repeat Sentences",
    "C": "Short Answer",
    "D": "Arrange Sentences",
    "E": "Story Retelling",
    "F": "Open Questions",
    "G": "Describe Image",
    "H": "Listening Comprehension",
}

# ── Section A: Read Sentences (16 seeded, 8 per test) ─────────────────────────
SECTION_A = [
    "Technology is evolving rapidly, and we must adapt to stay competitive.",
    "Communication skills are essential for success in the modern workplace.",
    "The quarterly earnings report exceeded expectations for the third consecutive year.",
    "Artificial intelligence is transforming industries from healthcare to finance.",
    "Effective leadership requires empathy, vision, and the ability to inspire others.",
    "The research team published their findings in a prestigious international journal.",
    "Sustainable development balances economic growth with environmental responsibility.",
    "Customer satisfaction surveys revealed a significant improvement over last quarter.",
    "The new software update introduces several features that enhance user productivity.",
    "Global collaboration has become increasingly important in today's interconnected world.",
    "Engineers must consider both functionality and user experience when designing products.",
    "The conference attracted over two thousand participants from thirty different countries.",
    "Regular exercise and a balanced diet contribute to overall physical and mental health.",
    "The company announced plans to expand its operations into three new international markets.",
    "Data privacy regulations require organizations to handle personal information responsibly.",
    "Innovation often comes from questioning established practices and exploring new possibilities.",
]

# ── Section B: Repeat Sentences (32 seeded, 16 per test) ──────────────────────
SECTION_B = [
    "The company announced a new policy regarding remote work flexibility.",
    "Please ensure that all documents are submitted before the deadline.",
    "We need to schedule a meeting to discuss the project requirements.",
    "The training program will help employees develop their technical skills.",
    "Our team successfully completed the project ahead of schedule and under budget.",
    "The manager requested a detailed report on the current market trends.",
    "Candidates should demonstrate strong problem-solving abilities during the interview.",
    "The presentation covered key strategies for improving customer engagement.",
    "Regular feedback sessions help teams identify areas for improvement.",
    "The new office building will be equipped with the latest technology infrastructure.",
    "Students are encouraged to participate in extracurricular activities for holistic development.",
    "The research indicates a strong correlation between teamwork and productivity.",
    "All employees must complete the mandatory safety training by the end of this month.",
    "The client expressed satisfaction with the quality of our deliverables.",
    "Cloud computing has significantly reduced the cost of IT infrastructure for small businesses.",
    "The internship program provides valuable hands-on experience in a professional environment.",
    "We should analyze the data carefully before making any strategic decisions.",
    "The marketing campaign generated a twenty percent increase in website traffic.",
    "Effective time management is crucial for maintaining work-life balance.",
    "The development team implemented an agile methodology to improve workflow efficiency.",
    "Please review the attached document and provide your feedback by Friday.",
    "The quarterly review meeting has been rescheduled to next Wednesday afternoon.",
    "Our customer support team is available around the clock to assist with inquiries.",
    "The software engineering department is hiring three senior developers this quarter.",
    "Environmental sustainability should be a core consideration in all business decisions.",
    "The project timeline was extended by two weeks to accommodate additional testing.",
    "Effective communication between departments leads to better organizational outcomes.",
    "The annual technology summit will feature keynote speakers from leading tech companies.",
    "We recommend conducting a thorough risk assessment before launching the new product.",
    "The university offers a wide range of courses in computer science and engineering.",
    "Team members are expected to contribute actively during brainstorming sessions.",
    "The digital transformation initiative aims to modernize our legacy systems by next year.",
]

# ── Section C: Short Answer (48 seeded, 24 per test) ──────────────────────────
SECTION_C = [
    # ── Preference / Conversational (24 questions) ────────────────────────────
    {"q": "Do you prefer tea or coffee?", "kw": "tea,coffee"},
    {"q": "Mountains or beach — which do you prefer?", "kw": "mountains,beach,mountain"},
    {"q": "Are you a morning person or a night owl?", "kw": "morning,night,owl"},
    {"q": "Do you prefer reading books or watching movies?", "kw": "books,reading,movies,films"},
    {"q": "Would you rather live in a city or a village?", "kw": "city,village,town,urban,rural"},
    {"q": "Do you prefer working alone or in a team?", "kw": "alone,team,together,group"},
    {"q": "Hot weather or cold weather — which do you prefer?", "kw": "hot,cold,warm,cool"},
    {"q": "Do you prefer cooking at home or eating out?", "kw": "cooking,home,eating out,restaurant"},
    {"q": "Do you like indoor activities or outdoor activities?", "kw": "indoor,outdoor,inside,outside"},
    {"q": "Would you rather travel by train or by plane?", "kw": "train,plane,flight,rail"},
    {"q": "Do you prefer listening to music or watching TV?", "kw": "music,tv,television,songs"},
    {"q": "Sweet or salty — which do you prefer as a snack?", "kw": "sweet,salty,snack"},
    {"q": "Do you prefer summer or winter?", "kw": "summer,winter"},
    {"q": "Would you rather have a dog or a cat as a pet?", "kw": "dog,cat,pet"},
    {"q": "Do you prefer typing on a laptop or writing by hand?", "kw": "laptop,typing,writing,hand,pen"},
    {"q": "Do you prefer studying in the morning or at night?", "kw": "morning,night,studying,study"},
    {"q": "Would you rather live near the ocean or in the mountains?", "kw": "ocean,sea,mountains,mountain"},
    {"q": "Do you prefer talking on the phone or texting?", "kw": "phone,call,texting,text,message"},
    {"q": "Do you prefer fiction or non-fiction books?", "kw": "fiction,non-fiction,nonfiction,novels"},
    {"q": "Would you rather be very rich or very famous?", "kw": "rich,famous,wealthy,celebrity"},
    {"q": "Do you prefer group travel or solo travel?", "kw": "group,solo,alone,together"},
    {"q": "Coffee or juice — what do you have in the morning?", "kw": "coffee,juice,tea,milk"},
    {"q": "Do you prefer fast food or home-cooked meals?", "kw": "fast food,home,cooked,homemade"},
    {"q": "Would you rather have a big house or a fancy car?", "kw": "house,car,home,vehicle"},

    # ── Factual / Direct (24 questions) ──────────────────────────────────────
    {"q": "What do you call a person who treats sick people?", "kw": "doctor,physician,medical"},
    {"q": "What do you use to brush your teeth?", "kw": "toothbrush,brush"},
    {"q": "What season comes after summer?", "kw": "autumn,fall"},
    {"q": "What is the opposite of hot?", "kw": "cold,cool"},
    {"q": "What do you use to cut paper?", "kw": "scissors,cutter"},
    {"q": "What animal is known as man's best friend?", "kw": "dog"},
    {"q": "What meal do you eat in the morning?", "kw": "breakfast"},
    {"q": "What device do you use to make phone calls?", "kw": "phone,mobile,cellphone,smartphone"},
    {"q": "What is the frozen form of water called?", "kw": "ice"},
    {"q": "What room in a house do you cook food in?", "kw": "kitchen"},
    {"q": "What vehicle travels on railway tracks?", "kw": "train"},
    {"q": "What organ pumps blood through your body?", "kw": "heart"},
    {"q": "What is the opposite of loud?", "kw": "quiet,soft,silent"},
    {"q": "What do bees make?", "kw": "honey"},
    {"q": "How many days are there in a week?", "kw": "seven,7"},
    {"q": "What do you call the person who flies an airplane?", "kw": "pilot"},
    {"q": "What instrument do you use to measure temperature?", "kw": "thermometer"},
    {"q": "What do you call a baby cat?", "kw": "kitten"},
    {"q": "Where do you go to catch a flight?", "kw": "airport"},
    {"q": "What do you carry when it rains?", "kw": "umbrella,raincoat"},
    {"q": "What material is a window made of?", "kw": "glass"},
    {"q": "What is the last month of the year?", "kw": "december"},
    {"q": "What shape has three sides?", "kw": "triangle"},
    {"q": "What is the capital of India?", "kw": "delhi,new delhi"},
]

# ── Section D: Arrange Sentences (20 seeded, 10 per test) ─────────────────────
SECTION_D = [
    {"jumbled": "quickly / the / brown / fox / jumped / over / the / lazy / dog", "answer": "the quick brown fox jumped over the lazy dog"},
    {"jumbled": "are / important / communication / skills / very", "answer": "communication skills are very important"},
    {"jumbled": "to / the / went / she / store / grocery", "answer": "she went to the grocery store"},
    {"jumbled": "every / exercise / morning / should / you", "answer": "you should exercise every morning"},
    {"jumbled": "the / deadline / before / submit / your / report", "answer": "submit your report before the deadline"},
    {"jumbled": "team / the / won / championship / our", "answer": "our team won the championship"},
    {"jumbled": "is / learning / for / important / growth / continuous", "answer": "continuous learning is important for growth"},
    {"jumbled": "the / at / meeting / starts / nine / o'clock", "answer": "the meeting starts at nine o'clock"},
    {"jumbled": "helps / reading / vocabulary / your / improve", "answer": "reading helps improve your vocabulary"},
    {"jumbled": "in / technology / has / advanced / years / recent", "answer": "technology has advanced in recent years"},
    {"jumbled": "project / the / completed / was / successfully", "answer": "the project was completed successfully"},
    {"jumbled": "students / must / all / the / attend / workshop", "answer": "all students must attend the workshop"},
    {"jumbled": "weather / the / today / is / beautiful", "answer": "the weather is beautiful today"},
    {"jumbled": "for / prepared / interview / the / she / carefully", "answer": "she prepared carefully for the interview"},
    {"jumbled": "new / company / the / launched / product / a", "answer": "the company launched a new product"},
    {"jumbled": "essential / water / is / for / life", "answer": "water is essential for life"},
    {"jumbled": "he / the / passed / with / exam / distinction", "answer": "he passed the exam with distinction"},
    {"jumbled": "innovation / drives / progress / economic", "answer": "innovation drives economic progress"},
    {"jumbled": "presentation / the / was / well / received / very", "answer": "the presentation was very well received"},
    {"jumbled": "need / we / better / infrastructure / public", "answer": "we need better public infrastructure"},
]

# ── Section E: Story Retelling (6 seeded, 3 per test) ─────────────────────────
SECTION_E = [
    {
        "story": "Sarah had always dreamed of becoming a pilot. When she was twelve, her father took her to an air show. Watching the planes loop and soar through the sky, she knew her future was in aviation. After years of hard work and training at the flight academy, she finally earned her wings at the age of twenty-three. Her first commercial flight was from Mumbai to Delhi, and her parents were her proudest passengers.",
        "key_points": "Sarah dreamed of becoming a pilot since childhood. Her father took her to an air show at age twelve which inspired her. She trained at a flight academy and earned her wings at twenty-three. Her first commercial flight was Mumbai to Delhi with her parents on board.",
    },
    {
        "story": "Ravi was a small-town boy who loved solving puzzles. His math teacher noticed his talent and encouraged him to enter competitions. At sixteen, he won the national mathematics olympiad. This achievement earned him a scholarship to a prestigious university. Today, Ravi works at a leading technology company, designing algorithms that help millions of people navigate their cities.",
        "key_points": "Ravi loved puzzles and was talented at math. His teacher encouraged him to compete. He won the national math olympiad at sixteen. He got a scholarship to a good university. Now he designs navigation algorithms at a tech company.",
    },
    {
        "story": "The village of Sundargram had no clean drinking water for years. The villagers had to walk three kilometers to the nearest well every day. Then a young engineer named Priya designed a simple rainwater harvesting system using local materials. Within six months, every household had access to clean water. Priya's innovation was later adopted by over fifty other villages in the district.",
        "key_points": "Sundargram village had no clean water and villagers walked far to get it. A young engineer Priya built a rainwater harvesting system with local materials. In six months all households had clean water. The system was adopted by over fifty other villages.",
    },
    {
        "story": "Last summer, a group of college students started a weekend tutoring program for underprivileged children in their neighborhood. They taught English, mathematics, and basic computer skills. The program started with just ten children, but within three months, over sixty students were attending regularly. Several parents volunteered to help with logistics. The local newspaper published a story about the program, which inspired similar initiatives in nearby towns.",
        "key_points": "College students started weekend tutoring for underprivileged children. They taught English, math, and computer skills. It grew from ten to sixty students in three months. Parents volunteered to help. A newspaper story inspired similar programs elsewhere.",
    },
    {
        "story": "Anita ran a small bakery in the heart of the city. Business was slow until she started posting her recipes and baking videos on social media. Her chocolate cake video went viral, attracting thousands of followers. Orders started pouring in from across the city. Within a year, she opened a second branch and hired five employees. She credits her success to the power of digital marketing and the quality of her ingredients.",
        "key_points": "Anita had a small bakery with slow business. She posted recipes and baking videos on social media. A chocolate cake video went viral. Orders increased dramatically. She opened a second branch and hired five employees within a year.",
    },
    {
        "story": "During the monsoon season, heavy rains caused severe flooding in the coastal town of Seaview. Hundreds of families were displaced from their homes. A team of disaster relief volunteers arrived within hours, setting up shelters, distributing food and medicine, and coordinating rescue operations. The government announced a relief fund, and citizens across the country donated generously. Within two weeks, most families had returned to their homes, and rebuilding efforts were well underway.",
        "key_points": "Heavy monsoon rains caused flooding in coastal town Seaview. Hundreds of families were displaced. Volunteers set up shelters and distributed food and medicine. The government created a relief fund with generous donations. Most families returned home within two weeks.",
    },
]

# ── Section F: Open Questions (4 seeded, 2 per test) ──────────────────────────
SECTION_F = [
    "Describe a challenging situation you faced and how you handled it.",
    "What are your career goals for the next five years, and how do you plan to achieve them?",
    "Talk about a person who has had a significant influence on your life and explain why.",
    "If you could change one thing about your city or town, what would it be and why?",
]

# ── Section G: Describe Image (6 seeded, 3 per test) ──────────────────────────
SECTION_G = [
    {
        "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
        "prompt": "Describe what you see in this image in detail.",
        "keywords": "restaurant,dining,tables,chairs,interior,people,food,lights,elegant",
    },
    {
        "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        "prompt": "Describe the scene shown in this image.",
        "keywords": "mountain,landscape,nature,sky,clouds,snow,peaks,scenic,outdoor",
    },
    {
        "image_url": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800",
        "prompt": "Describe what is happening in this image.",
        "keywords": "office,meeting,people,business,table,discussion,work,professional,laptop",
    },
    {
        "image_url": "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800",
        "prompt": "Describe the scene and the people in this image.",
        "keywords": "children,school,classroom,learning,students,education,books,teacher",
    },
    {
        "image_url": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800",
        "prompt": "Describe this cityscape in detail.",
        "keywords": "city,skyline,buildings,urban,architecture,skyscrapers,night,lights",
    },
    {
        "image_url": "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800",
        "prompt": "Describe the market scene shown in this image.",
        "keywords": "market,fruits,vegetables,colorful,fresh,vendor,stall,produce,food",
    },
]

# ── Section H: Listening Comprehension (8 seeded, 4 per test) ─────────────────
SECTION_H = [
    {
        "passage": "The library will be closed next Monday for renovations. All books currently on loan will have their return dates automatically extended by one week. Students can use the online portal to access digital resources during the closure.",
        "question": "Why is the library closing next Monday?",
        "keywords": "renovations,renovation,repair,maintenance",
    },
    {
        "passage": "The company cafeteria will introduce a new menu starting next month. The updated menu will include more vegetarian and vegan options based on employee feedback. Breakfast will now be served from seven thirty in the morning instead of eight.",
        "question": "What time will breakfast be served under the new schedule?",
        "keywords": "seven thirty,7:30,seven-thirty,730",
    },
    {
        "passage": "Due to the upcoming holiday weekend, the office will operate on reduced hours from Thursday. Employees working on client projects should coordinate with their managers to ensure all deliverables are submitted by Wednesday evening. The office will resume normal operations on Tuesday.",
        "question": "By when should client deliverables be submitted?",
        "keywords": "wednesday,wednesday evening",
    },
    {
        "passage": "The city council has approved a new cycling lane along Main Street to promote eco-friendly transportation. Construction will begin in April and is expected to take approximately three months. During construction, one lane of traffic will be temporarily closed.",
        "question": "How long will the construction of the cycling lane take?",
        "keywords": "three months,3 months",
    },
    {
        "passage": "A new study by the health department found that employees who take short breaks every ninety minutes are thirty percent more productive than those who work without breaks. The study recommends a five-minute walk or stretching session to recharge energy levels.",
        "question": "How often does the study recommend taking breaks?",
        "keywords": "ninety minutes,90 minutes,every ninety,every 90",
    },
    {
        "passage": "The annual science fair will be held in the school auditorium on March fifteenth. Students must register their projects with the science department by March first. Prizes will be awarded in three categories: innovation, presentation, and practical application.",
        "question": "What are the three prize categories at the science fair?",
        "keywords": "innovation,presentation,practical application",
    },
    {
        "passage": "The new employee orientation program has been redesigned to span three days instead of the previous one-day format. Day one covers company history and policies. Day two focuses on technical training and tool setup. Day three includes team introductions and a mentorship pairing session.",
        "question": "What happens on the second day of the orientation program?",
        "keywords": "technical training,tool setup,technical,tools",
    },
    {
        "passage": "The local bus service has announced changes to Route Forty-Two effective next week. The route will now include two additional stops near the hospital and the shopping mall. Service frequency during peak hours will increase from every twenty minutes to every fifteen minutes.",
        "question": "How frequently will buses run during peak hours under the new schedule?",
        "keywords": "fifteen minutes,15 minutes,every fifteen,every 15",
    },
]

# ── Seed all questions ─────────────────────────────────────────────────────────

count = 0

# Section A
for i, sentence in enumerate(SECTION_A):
    db.add(CommQuestion(
        section="A",
        section_name=SECTION_NAMES["A"],
        prompt_text=sentence,
        ideal_answer=sentence.lower(),
        time_limit=15,
        order_index=i,
    ))
    count += 1

# Section B
for i, sentence in enumerate(SECTION_B):
    db.add(CommQuestion(
        section="B",
        section_name=SECTION_NAMES["B"],
        prompt_text="Listen and repeat the sentence.",
        ideal_answer=sentence.lower(),
        audio_text=sentence,
        time_limit=15,
        order_index=i,
    ))
    count += 1

# Section C
for i, item in enumerate(SECTION_C):
    db.add(CommQuestion(
        section="C",
        section_name=SECTION_NAMES["C"],
        prompt_text=item["q"],
        ideal_answer=item["kw"],
        time_limit=10,
        order_index=i,
    ))
    count += 1

# Section D
for i, item in enumerate(SECTION_D):
    db.add(CommQuestion(
        section="D",
        section_name=SECTION_NAMES["D"],
        prompt_text=f"Arrange these words into a correct sentence:\n{item['jumbled']}",
        ideal_answer=item["answer"].lower(),
        time_limit=20,
        order_index=i,
    ))
    count += 1

# Section E
for i, item in enumerate(SECTION_E):
    db.add(CommQuestion(
        section="E",
        section_name=SECTION_NAMES["E"],
        prompt_text=item["story"],
        ideal_answer=item["key_points"],
        time_limit=90,
        order_index=i,
    ))
    count += 1

# Section F
for i, prompt in enumerate(SECTION_F):
    db.add(CommQuestion(
        section="F",
        section_name=SECTION_NAMES["F"],
        prompt_text=prompt,
        ideal_answer="",
        time_limit=45,
        order_index=i,
    ))
    count += 1

# Section G
for i, item in enumerate(SECTION_G):
    db.add(CommQuestion(
        section="G",
        section_name=SECTION_NAMES["G"],
        prompt_text=item["prompt"],
        ideal_answer=item["keywords"],
        image_url=item["image_url"],
        time_limit=45,
        order_index=i,
    ))
    count += 1

# Section H
for i, item in enumerate(SECTION_H):
    db.add(CommQuestion(
        section="H",
        section_name=SECTION_NAMES["H"],
        prompt_text=item["question"],
        ideal_answer=item["keywords"],
        audio_text=item["passage"],
        time_limit=15,
        order_index=i,
    ))
    count += 1

db.commit()
print(f"Seeded {count} communication questions.")
print(f"  Section A (Read):      {len(SECTION_A)}")
print(f"  Section B (Repeat):    {len(SECTION_B)}")
print(f"  Section C (Short):     {len(SECTION_C)}")
print(f"  Section D (Arrange):   {len(SECTION_D)}")
print(f"  Section E (Story):     {len(SECTION_E)}")
print(f"  Section F (Open):      {len(SECTION_F)}")
print(f"  Section G (Image):     {len(SECTION_G)}")
print(f"  Section H (Listen):    {len(SECTION_H)}")
db.close()
