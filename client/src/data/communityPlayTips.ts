/**
 * Community Play Tips — curated play ideas from parent communities.
 * Sources: Reddit (r/Lovevery, r/Montessori, r/toddlers), Lovevery Blog,
 * Babylist reviews, Amazon reviews, parenting blogs.
 */

export interface PlayTip {
  id: string;
  productId: string;
  tip: string;
  tipEn: string;
  source: string;
  ageRange?: string;
  ageRangeEn?: string;
}

export const communityPlayTips: PlayTip[] = [
  // ─── Music Set ───
  {
    id: "music-tip-1",
    productId: "musicSet",
    tip: "每天固定一个「音乐时间」，和宝宝一起给不同的铃铛起名字（比如「高高铃」「低低铃」），他们会更主动地记住音高差异。",
    tipEn: "Set up a daily 'music time' and name each bell together (like 'High Bell' and 'Low Bell'). Kids remember pitch differences more actively when bells have names.",
    source: "Parent Community",
    ageRange: "12-24 个月",
    ageRangeEn: "12-24 months",
  },
  {
    id: "music-tip-2",
    productId: "musicSet",
    tip: "播放他们熟悉的儿歌，让宝宝用铃铛跟着节奏拍。我女儿最喜欢用排笛吹《小星星》，虽然音不准但练气息很有效！",
    tipEn: "Play a familiar nursery rhyme and let your child tap along on the bells. My daughter loves 'blowing' Twinkle Twinkle on the pan flute — not on pitch yet, but great breath practice!",
    source: "Reddit r/Lovevery",
    ageRange: "18 个月以上",
    ageRangeEn: "18+ months",
  },
  {
    id: "music-tip-3",
    productId: "musicSet",
    tip: "把乐器藏在毯子下面，摇一摇让宝宝猜是哪个乐器发出的声音。这个游戏锻炼听觉辨别能力，我家每晚睡前都玩。",
    tipEn: "Hide instruments under a blanket, shake one, and ask your child to guess which instrument made the sound. Great for auditory discrimination — we play this every night before bed.",
    source: "Lovevery Blog",
    ageRange: "24 个月以上",
    ageRangeEn: "24+ months",
  },
  {
    id: "music-tip-4",
    productId: "musicSet",
    tip: "组织一个小型家庭乐队！爸爸摇沙锤打节拍，妈妈拉手风琴，宝宝自由选择乐器。全家合奏比独自玩有趣十倍。",
    tipEn: "Organize a mini family band! Dad shakes the shakers for rhythm, Mom plays the concertina, and baby picks their instrument freely. Playing together is ten times more engaging than solo play.",
    source: "Parent Community",
    ageRange: "12 个月以上",
    ageRangeEn: "12+ months",
  },

  // ─── Bath Set ───
  {
    id: "bath-tip-1",
    productId: "bathSet",
    tip: "把大鸭子和小鸭子当成「鸭子妈妈和宝宝」，编一个洗澡冒险故事。我儿子现在每次洗澡都要求「鸭鸭故事时间」。",
    tipEn: "Turn the big and little ducks into 'Mama Duck and Baby Duck' and create a bath adventure story. My son now requests 'ducky story time' at every bath.",
    source: "Reddit r/toddlers",
    ageRange: "12-24 个月",
    ageRangeEn: "12-24 months",
  },
  {
    id: "bath-tip-2",
    productId: "bathSet",
    tip: "用舀水杯给大鸭子洗澡，再给小鸭子洗澡，让孩子体验倒水量的多少。也可以计数：'倒一杯、两杯、三杯…'，数学启蒙很自然。",
    tipEn: "Use the scoop cup to 'bathe' the big duck, then the little duck, exploring different pour volumes. Count along: 'one cup, two cups, three cups…' — natural math introduction.",
    source: "Lovevery Blog",
    ageRange: "12 个月以上",
    ageRangeEn: "12+ months",
  },
  {
    id: "bath-tip-3",
    productId: "bathSet",
    tip: "在浴缸里放不同的小物品（瓶盖、海绵块、勺子），让孩子猜哪些沉哪些浮。再用躲猫猫小船做实验——装水沉下去，倒水浮起来。",
    tipEn: "Put various small objects in the tub (bottle cap, sponge, spoon) and let your child guess which sink or float. Then experiment with the Peek-A-Boo Boat — fill it to sink, empty it to float.",
    source: "Parent Community",
    ageRange: "18 个月以上",
    ageRangeEn: "18+ months",
  },
  {
    id: "bath-tip-4",
    productId: "bathSet",
    tip: "洗澡镜子不只是照脸！试试让孩子用手指在镜面上画水画，或者把镜子放平当「停机坪」，让鸭子从上面滑下去。",
    tipEn: "The bath mirror isn't just for faces! Let your child draw water pictures on it with their finger, or lay it flat as a 'landing pad' for ducks to slide off of.",
    source: "Reddit r/Montessori",
    ageRange: "9 个月以上",
    ageRangeEn: "9+ months",
  },

  // ─── Block Set ───
  {
    id: "block-tip-1",
    productId: "blockSet",
    tip: "和孩子一起搭一个「小城市」——用积木块当房子，木板当道路，拱门当桥梁，小人偶住在里面。我们家的积木城一周都不拆。",
    tipEn: "Build a 'little city' together — cubes as houses, planks as roads, arches as bridges, and play people living inside. Our block city stayed up for a whole week.",
    source: "Parent Community",
    ageRange: "24 个月以上",
    ageRangeEn: "24+ months",
  },
  {
    id: "block-tip-2",
    productId: "blockSet",
    tip: "玩「颜色寻宝」——家长说一个颜色，孩子从70块里找出所有那个颜色的积木。18种颜色够玩很久，顺便教了颜色词汇。",
    tipEn: "Play 'color treasure hunt' — parent says a color, child finds all matching blocks from the 70 pieces. With 18 colors, this goes on forever and naturally teaches color vocabulary.",
    source: "Reddit r/Montessori",
    ageRange: "18 个月以上",
    ageRangeEn: "18+ months",
  },
  {
    id: "block-tip-3",
    productId: "blockSet",
    tip: "穿线积木对2岁前的宝宝偏难，但可以先把积木当项链珠子排列，培养序列概念。等手指灵活了再穿线，挫败感会小很多。",
    tipEn: "Threading blocks can be frustrating before age 2. Start by lining them up like necklace beads to build sequencing concepts. Move to actual threading once their fingers are more dexterous — much less frustration.",
    source: "Lovevery Blog",
    ageRange: "12-24 个月",
    ageRangeEn: "12-24 months",
  },
  {
    id: "block-tip-4",
    productId: "blockSet",
    tip: "让孩子用收纳盒的斜坡给小汽车或弹珠做滑道。配合积木搭高低不同的支架，物理实验就这样开始了。",
    tipEn: "Use the storage box ramp as a slide for toy cars or marbles. Build supports at different heights with the blocks, and just like that — physics experiments begin.",
    source: "Parent Community",
    ageRange: "24 个月以上",
    ageRangeEn: "24+ months",
  },

  // ─── Play Gym ───
  {
    id: "gym-tip-1",
    productId: "playGym",
    tip: "趴趴时间宝宝不配合？试试把一面小镜子立在游戏垫前面，宝宝看到自己会好奇地抬头撑更久。比任何玩具都管用。",
    tipEn: "Baby refuses tummy time? Try propping a small mirror in front of the play mat. Seeing their own reflection makes babies curious enough to hold their head up much longer. Works better than any toy.",
    source: "Reddit r/BabyBumps",
    ageRange: "0-6 个月",
    ageRangeEn: "0-6 months",
  },
  {
    id: "gym-tip-2",
    productId: "playGym",
    tip: "把游戏空间盖翻过来当成小帐篷，再用毯子搭在上面，变成宝宝的私密阅读角。大一点的孩子特别喜欢有自己的「小空间」。",
    tipEn: "Flip the play space cover into a mini tent, drape a blanket over it, and it becomes a cozy reading nook. Older babies and toddlers especially love having their own 'little space'.",
    source: "Lovevery Blog",
    ageRange: "6-12 个月",
    ageRangeEn: "6-12 months",
  },
  {
    id: "gym-tip-3",
    productId: "playGym",
    tip: "高对比度球可以当万能玩具用到1岁以后——滚给宝宝练追爬，放在隧道另一头当目标物，藏起来玩躲猫猫。太值了。",
    tipEn: "The high-contrast ball works as a universal toy well past 12 months — roll it for crawling chase, place it at the end of a tunnel as a target, hide it for peek-a-boo. Incredible value.",
    source: "Parent Community",
    ageRange: "0-18 个月",
    ageRangeEn: "0-18 months",
  },

  // ─── Montessori Playshelf ───
  {
    id: "shelf-tip-1",
    productId: "montessoriPlayshelf",
    tip: "每次只摆4-5个玩具在架子上，其余的收进收纳箱轮换。我家两周换一批，每次换完孩子像收到新礼物一样兴奋。",
    tipEn: "Display only 4-5 toys on the shelf at a time, store the rest in the bins for rotation. We rotate every two weeks, and each time our child gets excited as if receiving new presents.",
    source: "Reddit r/Montessori",
    ageRange: "12 个月以上",
    ageRangeEn: "12+ months",
  },
  {
    id: "shelf-tip-2",
    productId: "montessoriPlayshelf",
    tip: "观察孩子最近对什么感兴趣，围绕主题摆放。比如孩子迷上了车，就放小汽车、车车书、汽车拼图。比随便放一堆玩具有效多了。",
    tipEn: "Observe what your child is interested in and curate the shelf by theme. If they're into cars, put out toy cars, car books, and car puzzles. Way more effective than a random pile of toys.",
    source: "Lovevery Blog",
    ageRange: "18 个月以上",
    ageRangeEn: "18+ months",
  },
  {
    id: "shelf-tip-3",
    productId: "montessoriPlayshelf",
    tip: "让孩子自己参与收拾——「积木住在这个格子，书住在那个格子」。用简单的图片标签贴在对应格子上，孩子很快就能独立整理。",
    tipEn: "Involve your child in cleanup — 'blocks live in this spot, books live in that spot.' Use simple picture labels on each shelf space, and they'll learn to tidy up independently in no time.",
    source: "Parent Community",
    ageRange: "18 个月以上",
    ageRangeEn: "18+ months",
  },
  {
    id: "shelf-tip-4",
    productId: "montessoriPlayshelf",
    tip: "在储物箱里放上本周的「神秘活动包」——一个小拉链袋装着水彩和纸，另一个装着橡皮泥。孩子每天自己选一个打开，像拆盲盒。",
    tipEn: "Put 'mystery activity packs' in the storage bins — one ziplock with watercolors and paper, another with playdough. Your child picks one to open each day, like a blind box surprise.",
    source: "Reddit r/Montessori",
    ageRange: "24 个月以上",
    ageRangeEn: "24+ months",
  },

  // ─── Buddy Stroller ───
  {
    id: "stroller-tip-1",
    productId: "buddyStroller",
    tip: "让宝宝给毛绒动物或娃娃系上安全带，然后推着「宝宝」去厨房、卧室、阳台「旅行」。每到一站讲一个简单的故事。",
    tipEn: "Have your child buckle in a stuffed animal or doll, then push their 'baby' on a tour — kitchen, bedroom, balcony. Tell a simple story at each 'stop' to build narrative skills.",
    source: "Babylist Reviews",
    ageRange: "12-24 个月",
    ageRangeEn: "12-24 months",
  },
  {
    id: "stroller-tip-2",
    productId: "buddyStroller",
    tip: "在走廊用枕头和纸盒做简单的障碍赛道，让宝宝推着推车绕过去。锻炼平衡感和空间判断力，我家走了一下午不带累的。",
    tipEn: "Set up a simple obstacle course in the hallway with pillows and boxes, then let your child push the stroller through. Builds balance and spatial awareness — ours played for hours without getting tired.",
    source: "Reddit r/toddlers",
    ageRange: "14 个月以上",
    ageRangeEn: "14+ months",
  },
  {
    id: "stroller-tip-3",
    productId: "buddyStroller",
    tip: "推车也是最好的「搬运工具」。让孩子把积木、绘本、水果一趟趟搬到另一个房间，模拟送货。他们特别有成就感。",
    tipEn: "The stroller doubles as the best 'delivery truck.' Have your child load up blocks, books, or fruit and deliver them to another room. They feel incredibly accomplished doing 'deliveries.'",
    source: "Parent Community",
    ageRange: "12 个月以上",
    ageRangeEn: "12+ months",
  },
  {
    id: "stroller-tip-4",
    productId: "buddyStroller",
    tip: "刚学走路不太稳？推车是最自然的辅助工具。「准备好了吗？3、2、1，出发！」我女儿用它从扶着走到独立走只花了两周。",
    tipEn: "Just learning to walk and still wobbly? The stroller is the most natural walking aid. 'Ready? 3, 2, 1, go!' My daughter went from supported to independent walking in just two weeks using it.",
    source: "Babylist Reviews",
    ageRange: "12-15 个月",
    ageRangeEn: "12-15 months",
  },

  // ─── Pull Pup ───
  {
    id: "pup-tip-1",
    productId: "pullPup",
    tip: "给小狗取一个名字！我儿子叫它「旺旺」，每天早上第一件事就是带旺旺散步。有了名字以后，小狗变成了真正的伙伴。",
    tipEn: "Give the pup a name! My son calls his 'Woof-Woof' and the first thing he does every morning is take Woof-Woof for a walk. Once named, the pup becomes a real companion.",
    source: "Amazon Reviews",
    ageRange: "18 个月以上",
    ageRangeEn: "18+ months",
  },
  {
    id: "pup-tip-2",
    productId: "pullPup",
    tip: "在地上用彩色胶带贴出弯弯曲曲的「遛狗路线」，让孩子拉着小狗沿着路线走。弯道特别考验方向控制能力。",
    tipEn: "Use colored tape on the floor to make a winding 'dog walking path' for your child to follow with the pup. Curves are especially challenging for directional control.",
    source: "Parent Community",
    ageRange: "18 个月以上",
    ageRangeEn: "18+ months",
  },
  {
    id: "pup-tip-3",
    productId: "pullPup",
    tip: "让孩子竖起小狗的耳朵和尾巴，然后模仿小狗的动作——竖耳朵听声音、摇尾巴表示开心。很好的动物认知和情绪表达练习。",
    tipEn: "Have your child flip up the pup's ears and tail, then imitate the dog — perk ears to 'listen,' wag tail to show 'happy.' Great animal awareness and emotional expression practice.",
    source: "Lovevery Blog",
    ageRange: "18-36 个月",
    ageRangeEn: "18-36 months",
  },
  {
    id: "pup-tip-4",
    productId: "pullPup",
    tip: "带小狗去户外「探险」！人行道、草地、碎石路——不同路面的触感和滚动声音完全不同，孩子会主动观察和比较。",
    tipEn: "Take the pup on an outdoor 'adventure'! Sidewalk, grass, gravel — different surfaces create completely different sensations and rolling sounds. Kids naturally observe and compare.",
    source: "Reddit r/toddlers",
    ageRange: "18 个月以上",
    ageRangeEn: "18+ months",
  },

  // ─── Play Tunnel ───
  {
    id: "tunnel-tip-1",
    productId: "playTunnel",
    tip: "在隧道一端放拼图碎片，另一端放拼图底板。孩子必须爬过去取一块、爬回来放上，来回反复完成拼图。比单纯爬好玩太多！",
    tipEn: "Put puzzle pieces at one end and the puzzle board at the other. Your child crawls through to grab a piece, crawls back to place it. Repeat until the puzzle is done — so much more engaging than plain crawling!",
    source: "Lovevery Blog",
    ageRange: "12-24 个月",
    ageRangeEn: "12-24 months",
  },
  {
    id: "tunnel-tip-2",
    productId: "playTunnel",
    tip: "把隧道放在暗一点的角落，里面放一个手电筒和几本绘本。瞬间变成「秘密阅读洞穴」，我儿子在里面安静看了半小时。",
    tipEn: "Place the tunnel in a dim corner, put a flashlight and a few books inside. Instant 'secret reading cave' — my son sat quietly inside reading for 30 minutes.",
    source: "Lovevery Blog",
    ageRange: "18 个月以上",
    ageRangeEn: "18+ months",
  },
  {
    id: "tunnel-tip-3",
    productId: "playTunnel",
    tip: "天热的时候带到户外，在隧道一端接洒水器或者放一个充气泳池。孩子爬过隧道到达「水上乐园」，尖叫声能传出一条街！",
    tipEn: "On hot days, bring it outside and set up a sprinkler or kiddie pool at one end. Crawl through the tunnel to reach the 'water park' — the squeals carry down the whole street!",
    source: "Lovevery Blog",
    ageRange: "12 个月以上",
    ageRangeEn: "12+ months",
  },
  {
    id: "tunnel-tip-4",
    productId: "playTunnel",
    tip: "家长坐在隧道一端，轻轻摇晃隧道，让孩子感受晃动中爬行的乐趣。也可以把隧道缩起来再弹开，孩子觉得神奇极了。",
    tipEn: "Sit at one end and gently shake the tunnel while your child crawls through — they love the wobbly sensation. You can also scrunch the tunnel up and let it pop back open — pure magic to a toddler.",
    source: "Parent Community",
    ageRange: "12 个月以上",
    ageRangeEn: "12+ months",
  },

  // ─── Sensory Strands ───
  {
    id: "strands-tip-1",
    productId: "sensoryStrands",
    tip: "用藏起来的口袋一次只露出一根挂绳，让宝宝专注探索这根绳子的声音和触感。等他熟悉了，再换下一根比较异同。",
    tipEn: "Use the hideaway pocket to expose one strand at a time, letting baby focus on that strand's sound and texture. Once familiar, swap to the next and compare differences.",
    source: "Lovevery Blog",
    ageRange: "0-6 个月",
    ageRangeEn: "0-6 months",
  },
  {
    id: "strands-tip-2",
    productId: "sensoryStrands",
    tip: "挂在婴儿车遮阳篷上带出门！外出散步时宝宝有东西抓，不会无聊哭闹，而且风吹动挂绳会发出不同声音。",
    tipEn: "Clip them on the stroller canopy for outings! Baby has something to reach for during walks, reducing fussiness. Plus, the wind makes them produce different sounds naturally.",
    source: "Amazon Reviews",
    ageRange: "3-9 个月",
    ageRangeEn: "3-9 months",
  },
  {
    id: "strands-tip-3",
    productId: "sensoryStrands",
    tip: "趴趴时间的秘密武器——把挂绳挂低一点，宝宝趴着时伸手就能碰到。有声音反馈后他们会主动撑更久。比单纯趴着有趣多了。",
    tipEn: "Secret weapon for tummy time — hang the strands low enough for baby to reach while on their tummy. The sound feedback motivates them to hold the position longer. Way more fun than plain tummy time.",
    source: "Parent Community",
    ageRange: "2-6 个月",
    ageRangeEn: "2-6 months",
  },

  // ─── Newborn Gift Set ───
  {
    id: "gift-tip-1",
    productId: "newbornGiftSet",
    tip: "不要一次把所有东西都拿出来！第一周只用游戏垫和黑白卡片，第二周加入感官挂绳。循序渐进，避免过度刺激新生儿。",
    tipEn: "Don't unpack everything at once! Week 1: just the play gym and black-and-white cards. Week 2: add the sensory strands. Gradual introduction avoids overstimulating a newborn.",
    source: "Lovevery Blog",
    ageRange: "0-4 周",
    ageRangeEn: "0-4 weeks",
  },
  {
    id: "gift-tip-2",
    productId: "newbornGiftSet",
    tip: "送给新手爸妈的贴心建议：先把 Looker Kit 的使用指南看一遍再拆礼物。知道每个玩具对应什么发展阶段后，使用信心会大增。",
    tipEn: "Pro tip for new parents: read the Looker Kit play guide BEFORE unwrapping everything. Understanding which toy maps to which developmental stage boosts your confidence tremendously.",
    source: "Amazon Reviews",
    ageRange: "0 个月以上",
    ageRangeEn: "0+ months",
  },
  {
    id: "gift-tip-3",
    productId: "newbornGiftSet",
    tip: "这个礼盒最大的价值是「搭配效果」——游戏垫搭感官挂绳，黑白卡配卡片架。单买可能不知道怎么配合用，礼盒全帮你想好了。",
    tipEn: "The real value of this gift set is the 'combination effect' — play gym pairs with sensory strands, cards pair with the card holder. Buying separately, you might not know how to use them together; the set has it all figured out.",
    source: "Parent Community",
    ageRange: "0-12 个月",
    ageRangeEn: "0-12 months",
  },

  // ─── Montessori Placemat ───
  {
    id: "placemat-tip-1",
    productId: "montessoriPlacemat",
    tip: "让孩子在吃饭前自己「布置餐桌」——按照餐垫上的轮廓放好碗、盘、杯。每次都做，很快变成习惯。客人来了他们会骄傲地展示。",
    tipEn: "Let your child 'set the table' before meals — place bowl, plate, and cup in the printed outlines. Do it every time and it quickly becomes habit. When guests visit, they'll proudly demonstrate.",
    source: "Reddit r/Montessori",
    ageRange: "18 个月以上",
    ageRangeEn: "18+ months",
  },
  {
    id: "placemat-tip-2",
    productId: "montessoriPlacemat",
    tip: "不锈钢餐具一开始对小手来说偏重。先让孩子用它们练习舀水、舀沙子，等握力够了再过渡到正式吃饭，挫败感会小很多。",
    tipEn: "The stainless steel utensils can be heavy for small hands at first. Start by practicing scooping water or sand, then transition to actual eating once their grip strengthens — much less frustration.",
    source: "Parent Community",
    ageRange: "18-24 个月",
    ageRangeEn: "18-24 months",
  },
  {
    id: "placemat-tip-3",
    productId: "montessoriPlacemat",
    tip: "用餐垫做「配对游戏」——把多余的碗和杯子混在一起，让孩子按照轮廓把正确的放到正确的位置。像拼图一样好玩。",
    tipEn: "Turn the placemat into a 'matching game' — mix up extra bowls and cups, and let your child place the right item in the right outline. As fun as doing a puzzle.",
    source: "Lovevery Blog",
    ageRange: "24 个月以上",
    ageRangeEn: "24+ months",
  },
  {
    id: "placemat-tip-4",
    productId: "montessoriPlacemat",
    tip: "清洗很方便是真的，但要注意餐垫在光滑桌面上容易滑。我在下面垫了一块湿毛巾，再也不滑了。",
    tipEn: "Easy to clean is true, but the placemat can slide on smooth surfaces. I put a damp towel underneath — no more sliding.",
    source: "Amazon Reviews",
    ageRange: "18 个月以上",
    ageRangeEn: "18+ months",
  },
];

export function getPlayTipsByProductId(productId: string): PlayTip[] {
  return communityPlayTips.filter((t) => t.productId === productId);
}
