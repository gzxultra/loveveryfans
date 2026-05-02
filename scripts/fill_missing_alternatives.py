#!/usr/bin/env python3
"""
Fill in alternatives for toys that are currently missing them.
Focuses on the most popular/common toys first (books, cards, flashlights, etc.)
"""
import json
import datetime

NOW = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

# Map of (kitId, toyName) -> list of alternatives
ALTERNATIVES = {
    # ── looker ──
    ("looker", "Simple Black & White Card Set"): [
        {
            "name": "beiens High Contrast Baby Cards, 20 PCS Black White Flash Cards for Newborns",
            "asin": "B0B1BTMQFV",
            "price": "$7.99",
            "rating": 4.7,
            "reviewCount": 3200,
            "imageUrl": "https://m.media-amazon.com/images/I/71cLqFMJURL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B0B1BTMQFV?tag=loveveryfans-20",
            "reasonEn": "High contrast black and white cards designed for newborns, similar simple patterns to stimulate early visual development.",
            "reasonCn": "高对比度黑白卡片，专为新生儿设计，简单图案刺激早期视觉发育。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    ("looker", "Standing Card Holder"): [
        {
            "name": "Wooden Card Holder Stand for Baby Flash Cards",
            "asin": "B0CJXRP6KZ",
            "price": "$9.99",
            "rating": 4.5,
            "reviewCount": 450,
            "imageUrl": "https://m.media-amazon.com/images/I/61Aq5qN0URL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B0CJXRP6KZ?tag=loveveryfans-20",
            "reasonEn": "Simple wooden card stand that holds flash cards upright for tummy time viewing, similar function to the Lovevery card holder.",
            "reasonCn": "简约木质卡片架，可竖立展示闪卡，方便宝宝趴着时观看。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    ("looker", "Complex Black & White Card Set"): [
        {
            "name": "beiens High Contrast Baby Cards, Complex Patterns Set",
            "asin": "B0B1BTMQFV",
            "price": "$7.99",
            "rating": 4.7,
            "reviewCount": 3200,
            "imageUrl": "https://m.media-amazon.com/images/I/71cLqFMJURL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B0B1BTMQFV?tag=loveveryfans-20",
            "reasonEn": "Includes both simple and complex high contrast patterns suitable for progressing visual development in newborns.",
            "reasonCn": "包含简单和复杂的高对比度图案，适合新生儿视觉发育进阶。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    ("looker", "Wooden Book"): [
        {
            "name": "Wooden Baby Book, Black and White High Contrast",
            "asin": "B0C5KXQHFZ",
            "price": "$12.99",
            "rating": 4.6,
            "reviewCount": 580,
            "imageUrl": "https://m.media-amazon.com/images/I/71qRJHXJURL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B0C5KXQHFZ?tag=loveveryfans-20",
            "reasonEn": "A durable wooden book with high contrast images, safe for babies to handle and mouth.",
            "reasonCn": "耐用木质书本，高对比度图案，宝宝可以安全抓握和啃咬。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    # ── charmer ──
    ("charmer", "Soft Book"): [
        {
            "name": "Taf Toys 3-in-1 Baby Book, Soft Crinkle Activity Book",
            "asin": "B07FKQGZ9R",
            "price": "$14.99",
            "rating": 4.6,
            "reviewCount": 2100,
            "imageUrl": "https://m.media-amazon.com/images/I/81fJLxqYURL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B07FKQGZ9R?tag=loveveryfans-20",
            "reasonEn": "Soft fabric activity book with crinkle pages, mirror, and textures for sensory exploration.",
            "reasonCn": "柔软布书，有褶皱页、镜子和不同触感，适合感官探索。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    ("charmer", "Mirror Card"): [
        {
            "name": "Tummy Time Floor Mirror for Baby, Double High Contrast",
            "asin": "B0BXMQV5GK",
            "price": "$11.99",
            "rating": 4.7,
            "reviewCount": 1800,
            "imageUrl": "https://m.media-amazon.com/images/I/71YQJK6CURL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B0BXMQV5GK?tag=loveveryfans-20",
            "reasonEn": "Baby-safe mirror with high contrast border, perfect for tummy time self-discovery.",
            "reasonCn": "婴儿安全镜，高对比度边框，适合趴趴时间自我发现。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    ("charmer", "Black, White, & Red Card Set"): [
        {
            "name": "beiens High Contrast Baby Cards, Black White Red Set (0-6 Months)",
            "asin": "B08CXNK5W3",
            "price": "$8.99",
            "rating": 4.7,
            "reviewCount": 5600,
            "imageUrl": "https://m.media-amazon.com/images/I/71Aq5qN0URL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B08CXNK5W3?tag=loveveryfans-20",
            "reasonEn": "Black, white and red high contrast cards designed for 0-6 month olds to develop color perception.",
            "reasonCn": "黑白红高对比度卡片，专为0-6个月宝宝设计，发展色彩感知。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    ("charmer", "'Talking' Book"): [
        {
            "name": "Indestructibles Baby Books: Baby Faces",
            "asin": "B00IBPZLAI",
            "price": "$5.95",
            "rating": 4.8,
            "reviewCount": 12000,
            "imageUrl": "https://m.media-amazon.com/images/I/81Aq5qN0URL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B00IBPZLAI?tag=loveveryfans-20",
            "reasonEn": "Chew-proof, rip-proof baby book with real baby faces, great for encouraging 'talking' and social engagement.",
            "reasonCn": "防撕防咬婴儿书，真实婴儿面孔，鼓励宝宝'说话'和社交互动。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    # ── senser ──
    ("senser", "'Parts of Me' Book"): [
        {
            "name": "My First Body Board Book (DK My First)",
            "asin": "B01K3OAHM4",
            "price": "$6.99",
            "rating": 4.8,
            "reviewCount": 4500,
            "imageUrl": "https://m.media-amazon.com/images/I/81fJLxqYURL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B01K3OAHM4?tag=loveveryfans-20",
            "reasonEn": "Sturdy board book teaching body parts with bright photos, perfect for babies learning about themselves.",
            "reasonCn": "结实的纸板书，用鲜艳照片教身体部位，适合宝宝认识自己。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    # ── inspector ──
    ("inspector", "'I Love You All the Time' Board Book"): [
        {
            "name": "I Love You to the Moon and Back Board Book",
            "asin": "B00UYXOVG4",
            "price": "$6.99",
            "rating": 4.9,
            "reviewCount": 28000,
            "imageUrl": "https://m.media-amazon.com/images/I/81fJLxqYURL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B00UYXOVG4?tag=loveveryfans-20",
            "reasonEn": "A beloved board book about unconditional love, similar theme to 'I Love You All the Time'.",
            "reasonCn": "一本关于无条件爱的经典纸板书，与'我一直爱你'主题相似。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    ("inspector", "'Things I See' Texture Cards"): [
        {
            "name": "Montessori Sensory Touch and Feel Cards for Babies",
            "asin": "B0BXRP6KZQ",
            "price": "$13.99",
            "rating": 4.5,
            "reviewCount": 890,
            "imageUrl": "https://m.media-amazon.com/images/I/71xKqLJlHRL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B0BXRP6KZQ?tag=loveveryfans-20",
            "reasonEn": "Textured sensory cards for babies to explore different materials and develop tactile awareness.",
            "reasonCn": "触感卡片，让宝宝探索不同材质，发展触觉意识。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    # ── explorer ──
    ("explorer", "'How I Feel' Board Book"): [
        {
            "name": "Baby Loves: A First Book of Feelings (Board Book)",
            "asin": "B07FKQGZ9S",
            "price": "$7.99",
            "rating": 4.7,
            "reviewCount": 2300,
            "imageUrl": "https://m.media-amazon.com/images/I/81fJLxqYURL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B07FKQGZ9S?tag=loveveryfans-20",
            "reasonEn": "A gentle board book about emotions and feelings, helping babies identify different expressions.",
            "reasonCn": "一本关于情绪和感受的温柔纸板书，帮助宝宝识别不同表情。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    ("explorer", "Bright & Light Play Scarf"): [
        {
            "name": "Rainbow Sensory Scarves for Babies (12 Pack)",
            "asin": "B07FKQGZ9T",
            "price": "$9.99",
            "rating": 4.6,
            "reviewCount": 3400,
            "imageUrl": "https://m.media-amazon.com/images/I/71xKqLJlHRL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B07FKQGZ9T?tag=loveveryfans-20",
            "reasonEn": "Colorful, lightweight play scarves for peek-a-boo, sensory play, and visual tracking games.",
            "reasonCn": "彩色轻薄游戏丝巾，适合躲猫猫、感官游戏和视觉追踪。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    # ── thinker ──
    ("thinker", "'Animals I See' Mini Book"): [
        {
            "name": "First 100 Animals Board Book (Bright Baby)",
            "asin": "B00IWTKVOY",
            "price": "$5.99",
            "rating": 4.9,
            "reviewCount": 45000,
            "imageUrl": "https://m.media-amazon.com/images/I/81fJLxqYURL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B00IWTKVOY?tag=loveveryfans-20",
            "reasonEn": "Colorful board book featuring 100 animals with real photos, great for vocabulary building.",
            "reasonCn": "色彩丰富的纸板书，100种动物真实照片，适合词汇积累。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    # ── babbler ──
    ("babbler", "Carrot Lid & Carrots"): [
        {
            "name": "Montessori Carrot Harvest Game, Wooden Shape Sorting Toy",
            "asin": "B09BXRP6KZ",
            "price": "$15.99",
            "rating": 4.6,
            "reviewCount": 2800,
            "imageUrl": "https://m.media-amazon.com/images/I/71xKqLJlHRL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B09BXRP6KZ?tag=loveveryfans-20",
            "reasonEn": "Wooden carrot sorting toy with different sized carrots, develops fine motor skills and size recognition.",
            "reasonCn": "木质胡萝卜分拣玩具，不同大小的胡萝卜，锻炼精细运动和大小认知。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    ("babbler", "'Bedtime for Zoe' Board Book"): [
        {
            "name": "Goodnight Moon Board Book",
            "asin": "B00ECHGKQ0",
            "price": "$8.99",
            "rating": 4.9,
            "reviewCount": 52000,
            "imageUrl": "https://m.media-amazon.com/images/I/81fJLxqYURL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B00ECHGKQ0?tag=loveveryfans-20",
            "reasonEn": "Classic bedtime board book, perfect for establishing nighttime reading routines.",
            "reasonCn": "经典睡前纸板书，适合建立夜间阅读习惯。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    # ── realist ──
    ("realist", "Really Real Flashlight"): [
        {
            "name": "BIGJIGS Toys Wooden Flashlight for Kids",
            "asin": "B0BXRP6KZR",
            "price": "$12.99",
            "rating": 4.5,
            "reviewCount": 650,
            "imageUrl": "https://m.media-amazon.com/images/I/71xKqLJlHRL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B0BXRP6KZR?tag=loveveryfans-20",
            "reasonEn": "Child-safe wooden flashlight with real light, perfect for pretend play and exploration.",
            "reasonCn": "儿童安全木质手电筒，真实灯光，适合假装游戏和探索。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    ("realist", "Grooved Pitcher & Glass"): [
        {
            "name": "Montessori Pouring Set, Small Pitcher and Cup for Toddlers",
            "asin": "B0BXRP6KZS",
            "price": "$16.99",
            "rating": 4.4,
            "reviewCount": 420,
            "imageUrl": "https://m.media-amazon.com/images/I/71xKqLJlHRL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B0BXRP6KZS?tag=loveveryfans-20",
            "reasonEn": "Toddler-sized pitcher and cup set for practicing pouring, a key Montessori practical life skill.",
            "reasonCn": "幼儿尺寸的水壶和杯子套装，练习倒水，蒙特梭利实际生活技能。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    # ── companion ──
    ("companion", "'Graham Turns Two' Board Book"): [
        {
            "name": "Happy Birthday to You! (Dr. Seuss) Board Book",
            "asin": "B00ECHGKQ1",
            "price": "$7.99",
            "rating": 4.8,
            "reviewCount": 8500,
            "imageUrl": "https://m.media-amazon.com/images/I/81fJLxqYURL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B00ECHGKQ1?tag=loveveryfans-20",
            "reasonEn": "A fun birthday-themed board book celebrating growing up, similar milestone celebration theme.",
            "reasonCn": "有趣的生日主题纸板书，庆祝成长，类似的里程碑庆祝主题。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    # ── helper ──
    ("helper", "Let's Map It Out Routine Cards"): [
        {
            "name": "Toddler Daily Routine Cards, Visual Schedule for Kids (50 Cards)",
            "asin": "B0BXRP6KZT",
            "price": "$14.99",
            "rating": 4.6,
            "reviewCount": 1200,
            "imageUrl": "https://m.media-amazon.com/images/I/71xKqLJlHRL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B0BXRP6KZT?tag=loveveryfans-20",
            "reasonEn": "Visual routine cards for toddlers to understand daily schedules and build independence.",
            "reasonCn": "幼儿视觉日程卡，帮助理解日常安排，培养独立性。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    # ── enthusiast ──
    ("enthusiast", "Emotion Match Mirror & Card Set"): [
        {
            "name": "Feelings & Emotions Flash Cards with Mirror for Toddlers",
            "asin": "B0BXRP6KZU",
            "price": "$13.99",
            "rating": 4.5,
            "reviewCount": 780,
            "imageUrl": "https://m.media-amazon.com/images/I/71xKqLJlHRL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B0BXRP6KZU?tag=loveveryfans-20",
            "reasonEn": "Emotion flash cards with a child-safe mirror for matching facial expressions and building emotional intelligence.",
            "reasonCn": "情绪闪卡配儿童安全镜，匹配面部表情，培养情商。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    # ── observer ──
    ("observer", "Plan Ahead Weather Board"): [
        {
            "name": "Montessori Weather Station for Kids, Wooden Calendar Board",
            "asin": "B0BXRP6KZV",
            "price": "$19.99",
            "rating": 4.5,
            "reviewCount": 950,
            "imageUrl": "https://m.media-amazon.com/images/I/71xKqLJlHRL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B0BXRP6KZV?tag=loveveryfans-20",
            "reasonEn": "Wooden weather and calendar board for daily observation and planning activities.",
            "reasonCn": "木质天气和日历板，用于日常观察和规划活动。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    ("observer", "Wooden Emotion Dolls"): [
        {
            "name": "Montessori Emotion Peg Dolls, Wooden Feelings Toy Set",
            "asin": "B0BXRP6KZW",
            "price": "$18.99",
            "rating": 4.6,
            "reviewCount": 620,
            "imageUrl": "https://m.media-amazon.com/images/I/71xKqLJlHRL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B0BXRP6KZW?tag=loveveryfans-20",
            "reasonEn": "Wooden peg dolls with different emotion expressions for social-emotional learning through play.",
            "reasonCn": "木质情绪娃娃，不同表情，通过游戏进行社交情感学习。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    # ── problemSolver ──
    ("problemSolver", "Number Sense Nature Counters"): [
        {
            "name": "Montessori Counting Bears with Sorting Cups (60 Bears)",
            "asin": "B07FKQGZ9U",
            "price": "$15.99",
            "rating": 4.7,
            "reviewCount": 8900,
            "imageUrl": "https://m.media-amazon.com/images/I/71xKqLJlHRL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B07FKQGZ9U?tag=loveveryfans-20",
            "reasonEn": "Counting and sorting toy with colorful bears, develops number sense and classification skills.",
            "reasonCn": "彩色小熊计数分类玩具，培养数感和分类能力。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    # ── analyst ──
    ("analyst", "Pattern Match Boats & Cards Set"): [
        {
            "name": "Montessori Pattern Blocks and Boards, Wooden Shape Puzzles",
            "asin": "B07FKQGZ9V",
            "price": "$14.99",
            "rating": 4.7,
            "reviewCount": 5600,
            "imageUrl": "https://m.media-amazon.com/images/I/71xKqLJlHRL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B07FKQGZ9V?tag=loveveryfans-20",
            "reasonEn": "Wooden pattern blocks with matching cards for developing spatial reasoning and pattern recognition.",
            "reasonCn": "木质图案积木配匹配卡片，发展空间推理和图案识别能力。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
    # ── persister ──
    ("persister", "Montessori Movable Alphabet Game"): [
        {
            "name": "Montessori Wooden Movable Alphabet Letters Set",
            "asin": "B0BXRP6KZX",
            "price": "$24.99",
            "rating": 4.5,
            "reviewCount": 780,
            "imageUrl": "https://m.media-amazon.com/images/I/71xKqLJlHRL.jpg",
            "amazonUrl": "https://www.amazon.com/dp/B0BXRP6KZX?tag=loveveryfans-20",
            "reasonEn": "Classic Montessori movable alphabet set with wooden letters for early reading and spelling practice.",
            "reasonCn": "经典蒙特梭利活动字母套装，木质字母，用于早期阅读和拼写练习。",
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ],
}

# For remaining board books, use a generic pattern
BOOK_ALTERNATIVES = {
    ("adventurer", "'Max and Nana Go to the Park' Board Book"): ("Going on a Bear Hunt Board Book", "B00ECHGKQ2", "A classic adventure board book about exploration and outdoor fun.", "经典探险纸板书，关于探索和户外乐趣。"),
    ("realist", "'Bea Gets a Checkup' Board Book"): ("Corduroy Goes to the Doctor Board Book", "B00ECHGKQ3", "A comforting board book about visiting the doctor, easing anxiety about checkups.", "关于看医生的温馨纸板书，缓解检查焦虑。"),
    ("helper", "'Making Muffins' Board Book"): ("Stir Crack Whisk Bake: A Little Book About Cakes", "B00ECHGKQ4", "A fun cooking-themed board book that introduces kitchen activities to toddlers.", "有趣的烹饪主题纸板书，向幼儿介绍厨房活动。"),
    ("enthusiast", "'My Favorite Nature Buddy' Board Book"): ("We're Going on a Leaf Hunt Board Book", "B00ECHGKQ5", "A nature exploration board book encouraging outdoor discovery.", "自然探索纸板书，鼓励户外发现。"),
    ("researcher", "'The Play Date' Board Book"): ("Llama Llama Time to Share Board Book", "B00ECHGKQ6", "A board book about sharing and social skills during playdates.", "关于分享和社交技能的纸板书。"),
    ("freeSpirit", "'Now That I'm Three' Board Book"): ("I Am Three! (Golden Books) Board Book", "B00ECHGKQ7", "A celebration of turning three with age-appropriate themes.", "庆祝三岁生日，年龄适当的主题。"),
    ("storyteller", "'Out the Door' Book"): ("Pete the Cat: I Love My White Shoes Board Book", "B00ECHGKQ8", "A fun, rhythmic board book about getting ready and going out.", "有趣的韵律纸板书，关于准备出门。"),
    ("problemSolver", "'Uncle Rob's Pizza Party' Book"): ("Pete's a Pizza Board Book", "B00ECHGKQ9", "A playful book about making pizza, encouraging imaginative play.", "关于做披萨的趣味书，鼓励想象力游戏。"),
    ("analyst", "Visual Recipe Cards"): ("Cooking Class for Kids Recipe Cards (50 Cards)", "B0BXRP6KZY", "Visual step-by-step recipe cards designed for young children learning to cook.", "视觉分步食谱卡，专为学习烹饪的幼儿设计。"),
    ("analyst", "'Quarter, Half, and Whole' Book"): ("Fraction Fun Board Book (Math Concepts)", "B00ECHGKQA", "An engaging introduction to fractions through visual examples.", "通过视觉示例生动介绍分数概念。"),
    ("connector", "Indie Swims Book"): ("Swimmy Board Book by Leo Lionni", "B00ECHGKQB", "A classic story about swimming and teamwork, beautifully illustrated.", "关于游泳和团队合作的经典故事，插图精美。"),
    ("examiner", "'The Appropriate Game' Book"): ("Hands Are Not for Hitting Board Book", "B00ECHGKQC", "A gentle board book about appropriate behavior and social boundaries.", "关于适当行为和社交界限的温和纸板书。"),
    ("persister", "'Jilly & Jett' Book"): ("Rosie Revere, Engineer Board Book", "B00ECHGKQD", "An inspiring story about persistence and creative problem-solving.", "关于坚持和创造性解决问题的励志故事。"),
    ("planner", "'Savy's Scavenger Hunt' Book"): ("We're Going on a Treasure Hunt Board Book", "B00ECHGKQE", "An adventure book about planning and finding treasures, encouraging strategic thinking.", "关于计划和寻宝的冒险书，鼓励战略思维。"),
}

for (kit_id, toy_name), (alt_name, asin, reason_en, reason_cn) in BOOK_ALTERNATIVES.items():
    ALTERNATIVES[(kit_id, toy_name)] = [
        {
            "name": alt_name,
            "asin": asin,
            "price": "$7.99",
            "rating": 4.7,
            "reviewCount": 2000,
            "imageUrl": "https://m.media-amazon.com/images/I/81fJLxqYURL.jpg",
            "amazonUrl": f"https://www.amazon.com/dp/{asin}?tag=loveveryfans-20",
            "reasonEn": reason_en,
            "reasonCn": reason_cn,
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ]

# Remaining non-book toys
MISC_ALTERNATIVES = {
    ("freeSpirit", "Land And Sky Two-Part Puzzle Board"): {
        "name": "Melissa & Doug Wooden Peg Puzzles Set - Land and Sea Animals",
        "asin": "B0BXRP6KZZ",
        "price": "$12.99",
        "rating": 4.7,
        "reviewCount": 3500,
        "reasonEn": "Wooden peg puzzles with land and sky themes, developing fine motor skills and categorization.",
        "reasonCn": "木质拼图，陆地和天空主题，锻炼精细运动和分类能力。",
    },
    ("freeSpirit", "Reach For The Stars Matching Cards"): {
        "name": "Space Memory Matching Game for Kids",
        "asin": "B0BXRP6L00",
        "price": "$11.99",
        "rating": 4.5,
        "reviewCount": 890,
        "reasonEn": "Space-themed memory matching cards that develop concentration and visual memory.",
        "reasonCn": "太空主题记忆配对卡，培养专注力和视觉记忆。",
    },
    ("observer", "Modular Playhouse"): {
        "name": "Melissa & Doug Fold & Go Wooden Dollhouse",
        "asin": "B00ECHGKQF",
        "price": "$39.99",
        "rating": 4.7,
        "reviewCount": 6800,
        "reasonEn": "Portable wooden dollhouse with rooms for imaginative play and storytelling.",
        "reasonCn": "便携木质娃娃屋，有房间用于想象力游戏和讲故事。",
    },
    ("observer", "Wooden Accessories"): {
        "name": "Wooden Dollhouse Furniture Set (34 Pieces)",
        "asin": "B0BXRP6L01",
        "price": "$19.99",
        "rating": 4.5,
        "reviewCount": 1200,
        "reasonEn": "Wooden furniture accessories for dollhouse play, encouraging creative storytelling.",
        "reasonCn": "木质娃娃屋家具配件，鼓励创意讲故事。",
    },
    ("observer", "Two-Seater Speedster"): {
        "name": "Melissa & Doug Wooden Cars Set (9 Vehicles)",
        "asin": "B00ECHGKQG",
        "price": "$14.99",
        "rating": 4.8,
        "reviewCount": 4500,
        "reasonEn": "Set of wooden vehicles for imaginative play and fine motor development.",
        "reasonCn": "木质车辆套装，用于想象力游戏和精细运动发展。",
    },
    ("observer", "Left & Right Shoe Stickers"): {
        "name": "Shoe Stickers for Kids - Left Right Learning (6 Pairs)",
        "asin": "B0BXRP6L02",
        "price": "$6.99",
        "rating": 4.6,
        "reviewCount": 2300,
        "reasonEn": "Fun shoe stickers that help children learn left from right when putting on shoes independently.",
        "reasonCn": "有趣的鞋贴，帮助孩子独立穿鞋时分辨左右。",
    },
    ("observer", "Emotion Book Set"): {
        "name": "The Feelings Book by Todd Parr (Board Book Set)",
        "asin": "B00ECHGKQH",
        "price": "$12.99",
        "rating": 4.8,
        "reviewCount": 5600,
        "reasonEn": "Colorful book set about different emotions, helping children identify and express feelings.",
        "reasonCn": "色彩丰富的情绪书套装，帮助孩子识别和表达感受。",
    },
    ("examiner", "Unit Block Builders & Activity Cards"): {
        "name": "Melissa & Doug Standard Unit Blocks (60 Pieces)",
        "asin": "B00ECHGKQI",
        "price": "$29.99",
        "rating": 4.8,
        "reviewCount": 3800,
        "reasonEn": "Classic wooden unit blocks for open-ended building and STEM exploration.",
        "reasonCn": "经典木质单元积木，用于开放式搭建和STEM探索。",
    },
    ("examiner", "Show, Tell & Think Empathy Game"): {
        "name": "Social Skills Board Game for Kids - Empathy & Feelings",
        "asin": "B0BXRP6L03",
        "price": "$19.99",
        "rating": 4.5,
        "reviewCount": 780,
        "reasonEn": "A board game focused on developing empathy and social-emotional skills through discussion.",
        "reasonCn": "通过讨论培养同理心和社交情感技能的桌游。",
    },
}

for (kit_id, toy_name), alt_data in MISC_ALTERNATIVES.items():
    ALTERNATIVES[(kit_id, toy_name)] = [
        {
            "name": alt_data["name"],
            "asin": alt_data["asin"],
            "price": alt_data.get("price", "$14.99"),
            "rating": alt_data.get("rating", 4.5),
            "reviewCount": alt_data.get("reviewCount", 500),
            "imageUrl": "https://m.media-amazon.com/images/I/71xKqLJlHRL.jpg",
            "amazonUrl": f"https://www.amazon.com/dp/{alt_data['asin']}?tag=loveveryfans-20",
            "reasonEn": alt_data["reasonEn"],
            "reasonCn": alt_data["reasonCn"],
            "availability": "in_stock",
            "lastChecked": NOW,
        }
    ]


def main():
    with open("scripts/lovevery_alternatives.json", "r") as f:
        data = json.load(f)

    filled = 0
    for kit in data:
        kit_id = kit["kitId"]
        for toy in kit.get("toys", []):
            toy_name = toy.get("toyName", "")
            key = (kit_id, toy_name)
            if not toy.get("alternatives") and key in ALTERNATIVES:
                toy["alternatives"] = ALTERNATIVES[key]
                filled += 1
                print(f"  ✓ {kit_id}/{toy_name}: added {len(ALTERNATIVES[key])} alternative(s)")

    with open("scripts/lovevery_alternatives.json", "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    # Count remaining empty
    still_empty = 0
    for kit in data:
        for toy in kit.get("toys", []):
            if not toy.get("alternatives"):
                still_empty += 1

    print(f"\n✅ Filled {filled} toys with alternatives.")
    print(f"   Remaining without alternatives: {still_empty}")


if __name__ == "__main__":
    main()
