/* PetsDB — bilingual reference content built around the Five Domains Model
   (Mellor & Reid 1994; Mellor & Beausoleil 2015; Mellor 2017; Mellor et al. 2020). */
(function () {
  'use strict';
  const L = (en, zh) => ({ en, zh });

  const domains = [
    {
      id: 'nutrition', n: 1, color: '#D98A3D', icon: 'bowl',
      name: L('Nutrition', '營養'),
      label: L('Nutrition', '營養'),
      short: L('Food and water: amount, quality, variety and the experience of eating.',
               '食物與水：份量、質素、多樣性及進食的體驗。'),
      desc: L('Covers access to enough fresh water and a complete, balanced diet in the right amount. Poor nutrition leads to thirst, hunger and malaise. A good diet and enriched feeding bring the pleasures of taste, chewing and the comfort of feeling full.',
              '涵蓋能否獲得充足的清水，以及份量合適、完整均衡的飲食。營養欠佳會帶來口渴、飢餓和不適；良好的飲食和豐富的餵食方式則帶來品嚐、咀嚼的樂趣和飽足的舒適感。'),
      negative: L(['Thirst', 'Hunger', 'Malaise from malnutrition', 'Discomfort from over-eating or bloating'],
                  ['口渴', '飢餓', '營養不良引致的不適', '暴食或腹脹的不適']),
      positive: L(['Pleasure of drinking', 'Enjoyment of tastes, smells and textures', 'Pleasure of chewing', 'Comfort of satiety'],
                  ['喝水的滿足感', '享受食物的味道、氣味和口感', '咀嚼的樂趣', '飽足的舒適感']),
      goodConditions: L(['Fresh water always available', 'Complete and balanced diet for species and life stage', 'Correct portion size and healthy body weight', 'Variety and food enrichment (puzzle feeders, scatter feeding)'],
                        ['隨時有清潔的飲用水', '完整均衡、適合物種和生命階段的飲食', '份量恰當，體重健康', '食物多樣化並有餵食豐富化（益智餵食器、撒糧尋食）']),
      poorConditions: L(['Restricted or dirty water', 'Unbalanced or poor-quality food', 'Over- or under-feeding', 'Monotonous diet, no foraging opportunities'],
                        ['飲用水不足或不潔', '飲食不均衡或質素欠佳', '餵食過多或過少', '飲食單調，沒有覓食機會']),
      tips: {
        cat: L([
          'Cats are obligate carnivores: feed a complete and balanced cat food (cats need taurine, which dog food lacks).',
          'Offer several small meals a day. Puzzle feeders and hiding kibble let your cat "hunt" for food.',
          'Encourage drinking: wet food, a water fountain, and bowls placed away from food and the litter box.',
          'Weigh your cat monthly. Indoor, neutered cats easily become overweight.',
          'A cat that stops eating for more than 24 hours needs a vet. Cats can develop serious liver disease (hepatic lipidosis).',
          'Never feed onion, garlic, chocolate, grapes/raisins, alcohol or caffeine.'
        ], [
          '貓是肉食動物：請餵飼完整均衡的貓糧（貓需要牛磺酸，狗糧並不含足夠份量）。',
          '每日分多次少量餵食。益智餵食器或把乾糧收藏起來，可讓貓「狩獵」食物。',
          '鼓勵飲水：多餵濕糧、使用循環飲水機，並把水碗放在遠離食物和貓砂盆的位置。',
          '每月為貓量體重。室內及已絕育的貓很容易過重。',
          '貓隻停止進食超過 24 小時需盡快看獸醫，因為可能引致嚴重的脂肪肝。',
          '切勿餵食洋蔥、蒜頭、朱古力、提子／葡萄乾、酒精或咖啡因。'
        ]),
        dog: L([
          'Feed a complete and balanced diet suited to your dog\'s life stage, size and activity level.',
          'Measure portions. Treats should make up no more than about 10% of daily calories.',
          'Fresh water must always be available, especially after exercise and in hot weather.',
          'Make mealtimes enriching with snuffle mats, lick mats or puzzle feeders.',
          'Avoid vigorous exercise right after a large meal, especially for deep-chested breeds (risk of bloat).',
          'Toxic foods include chocolate, grapes/raisins, onion, garlic, xylitol (sweetener), macadamia nuts and cooked bones.'
        ], [
          '按狗隻的生命階段、體型和活動量，餵飼完整均衡的飲食。',
          '量度每餐份量。零食不應超過每日熱量約 10%。',
          '必須隨時提供清水，運動後和炎熱天氣時尤其重要。',
          '以嗅聞墊、舔食墊或益智餵食器令進食時間更豐富有趣。',
          '飽餐後避免劇烈運動，深胸犬種尤其要注意（有胃擴張扭轉風險）。',
          '有毒食物包括：朱古力、提子／葡萄乾、洋蔥、蒜頭、木糖醇（代糖）、夏威夷果仁及煮熟的骨頭。'
        ])
      },
      items: [
        { id: 'n1', text: L('Diet is complete, balanced and suitable for life stage', '飲食完整均衡，並適合其生命階段') },
        { id: 'n2', text: L('Fresh, clean water is always available', '隨時有清潔新鮮的飲用水') },
        { id: 'n3', text: L('Body weight and body condition are ideal', '體重及體態處於理想範圍') },
        { id: 'n4', text: L('Appetite is normal and mealtimes are enjoyable (variety, food puzzles)', '食慾正常，進食是愉快的體驗（食物多樣化、益智餵食）') }
      ]
    },
    {
      id: 'environment', n: 2, color: '#3E9C7C', icon: 'house',
      name: L('Physical Environment', '物理環境'),
      label: L('Environment', '環境'),
      short: L('The living space: comfort, safety, temperature, space, noise and air.',
               '生活空間：舒適、安全、溫度、空間、噪音和空氣。'),
      desc: L('Covers the physical conditions an animal lives in. Uncomfortable, unsafe or unpredictable surroundings cause thermal, physical and sensory discomfort. A comfortable, safe and stimulating environment gives physical comfort and sensory pleasure.',
              '涵蓋動物所處的物理生活條件。不舒適、不安全或難以預測的環境會造成冷熱、身體和感官上的不適；舒適、安全且富刺激的環境則提供身體上的舒適和感官的愉悅。'),
      negative: L(['Being too hot or too cold', 'Physical discomfort (hard surfaces, cramped space)', 'Noise, strong odours or harsh light', 'Feeling unsafe'],
                  ['過熱或過冷', '身體不適（硬地面、空間狹窄）', '噪音、刺鼻氣味或刺眼光線', '缺乏安全感']),
      positive: L(['Thermal comfort', 'Physical comfort when resting and moving', 'Pleasant sights, sounds and smells', 'Security of a safe, predictable space'],
                  ['溫度舒適', '休息和活動時身體舒適', '宜人的景象、聲音和氣味', '安全、可預測的空間帶來的安心感']),
      goodConditions: L(['Comfortable resting places', 'Space to move freely and explore', 'Comfortable temperature and fresh air', 'Low noise and a predictable routine'],
                        ['舒適的休息處', '可自由活動和探索的空間', '溫度舒適、空氣清新', '噪音低、作息規律可預測']),
      poorConditions: L(['Close confinement', 'Temperature extremes', 'Hard or slippery surfaces', 'Loud or unpredictable noise'],
                        ['長時間困於狹小空間', '溫度過高或過低', '地面堅硬或濕滑', '巨大或突如其來的噪音']),
      tips: {
        cat: L([
          'Follow the "five pillars" of a healthy cat environment: a safe place; separate key resources; chances to play and "hunt"; positive, predictable human contact; and respect for the cat\'s sense of smell.',
          'Provide one litter box per cat plus one extra. Scoop daily and keep boxes in quiet spots.',
          'Cats feel safer up high. Add cat trees, shelves or a window perch, plus hiding places such as boxes.',
          'Secure windows and balconies with screens or netting to prevent falls from height.',
          'Lilies are highly toxic to cats. Even pollen or vase water can cause kidney failure.',
          'Avoid strong air fresheners and scented litter. Cats rely heavily on smell.'
        ], [
          '遵從健康貓隻環境的「五大支柱」：安全的地方；分開擺放的重要資源；遊戲和「狩獵」的機會；正面而可預測的人貓互動；以及尊重貓的嗅覺。',
          '貓砂盆數量應為貓隻數目加一。每日清理，並放在寧靜的位置。',
          '貓在高處會更有安全感。請提供貓爬架、層架或窗台，以及紙箱等躲藏處。',
          '窗戶及露台應安裝防護網，防止貓隻從高處墮下。',
          '百合對貓有劇毒，即使是花粉或花瓶水也可導致腎衰竭。',
          '避免使用濃烈的空氣清新劑和香味貓砂。貓非常依賴嗅覺。'
        ]),
        dog: L([
          'Give your dog a comfortable bed in a quiet, draft-free place, plus a retreat it can choose to use.',
          'Hot, humid weather can cause heatstroke. Walk early or late, avoid hot pavements, and give shade and water. Flat-faced breeds are at higher risk.',
          'Use non-slip rugs on smooth floors, especially for puppies and senior dogs.',
          'Keep medicines, cleaning products, rubbish and toxic foods out of reach.',
          'Prepare for fireworks and thunderstorms: a safe den, closed curtains and calming background sound.',
          'Never leave a dog in a parked car, even for a few minutes.'
        ], [
          '為狗隻在寧靜、無風的地方提供舒適的床，以及一個牠可自行選擇使用的休息角落。',
          '炎熱潮濕的天氣可引致中暑。請在清晨或傍晚散步，避開熾熱的路面，並提供遮蔭和清水。扁面犬種風險更高。',
          '在光滑的地板上鋪設防滑地毯，幼犬和老犬尤其需要。',
          '把藥物、清潔用品、垃圾及有毒食物放在狗隻接觸不到的地方。',
          '為煙花和雷暴作好準備：安全的窩、拉上窗簾，並播放柔和的背景聲音。',
          '切勿把狗隻留在停泊的車內，即使只是數分鐘。'
        ])
      },
      items: [
        { id: 'e1', text: L('Comfortable, clean resting area at a suitable temperature', '有舒適、清潔且溫度適宜的休息處') },
        { id: 'e2', text: L('Safe surroundings free of hazards, with places to hide or retreat', '環境安全無危險，並有可躲藏或退避的地方') },
        { id: 'e3', text: L('Enough space and variety to explore (high places for cats, walks for dogs)', '有足夠空間及變化以供探索（貓：高處空間；狗：散步）') },
        { id: 'e4', text: L('Clean toileting facilities or regular toilet breaks', '有清潔的如廁設施或定時如廁機會') },
        { id: 'e5', text: L('Low noise, odours and other stressors in the surroundings', '周遭的噪音、氣味及其他壓力源低') }
      ]
    },
    {
      id: 'health', n: 3, color: '#D85C5C', icon: 'health',
      name: L('Health', '健康'),
      label: L('Health', '健康'),
      short: L('Freedom from disease, injury and pain; fitness and vitality.',
               '免受疾病、傷患和疼痛困擾；體能與活力。'),
      desc: L('Covers disease, injury, impaired body function and fitness. Ill health causes pain, nausea, breathlessness and weakness. Good health and fitness give comfort, vigour and the capacity to enjoy life.',
              '涵蓋疾病、受傷、身體機能障礙及體能。健康欠佳會帶來疼痛、噁心、呼吸困難和虛弱；良好的健康和體能則帶來舒適、活力及享受生活的能力。'),
      negative: L(['Pain', 'Nausea and sickness', 'Breathlessness', 'Weakness and fatigue', 'Itching and irritation'],
                  ['疼痛', '噁心及不適', '呼吸困難', '虛弱及疲倦', '痕癢及刺激']),
      positive: L(['Comfort of good health', 'Vigour and vitality', 'Comfort of physical fitness', 'Ease of movement'],
                  ['健康帶來的舒適', '精力與活力', '體格強健的舒適', '活動自如']),
      goodConditions: L(['Healthy, uninjured and fit', 'Preventive care is up to date', 'Problems treated early, with pain relief', 'Regular veterinary check-ups'],
                        ['健康、無傷患、體能良好', '預防性護理保持最新', '及早治療問題並適當止痛', '定期接受獸醫檢查']),
      poorConditions: L(['Untreated disease or injury', 'Unmanaged pain', 'Missed vaccinations or parasite control', 'Poor fitness or obesity'],
                        ['疾病或傷患未獲治療', '疼痛未獲處理', '錯過疫苗接種或防寄生蟲措施', '體能差或肥胖']),
      tips: {
        cat: L([
          'Cats hide pain well. Watch for hiding, less grooming, squinting, changes in litter box use or reduced appetite.',
          'A male cat straining in the litter box with little or no urine is an emergency. See a vet immediately.',
          'Arrange yearly check-ups, and twice-yearly check-ups for senior cats.',
          'Keep vaccinations and flea/worm control up to date, as advised by your vet.',
          'Dental disease is very common. Ask your vet about tooth brushing and dental checks.',
          'Make carrier training part of routine so vet visits are less stressful.'
        ], [
          '貓很會隱藏痛楚。留意牠是否經常躲藏、少了理毛、瞇眼、如廁習慣改變或食慾下降。',
          '公貓在貓砂盆用力卻只有少量或沒有小便，屬緊急情況，請立即看獸醫。',
          '每年進行身體檢查；老年貓應每半年檢查一次。',
          '按獸醫建議，保持疫苗接種及驅蟲（跳蚤、體內寄生蟲）最新。',
          '牙患非常普遍。請向獸醫查詢刷牙方法及定期牙科檢查。',
          '平日讓貓習慣外出籠，可減輕看獸醫時的壓力。'
        ]),
        dog: L([
          'Signs of pain include limping, reluctance to move or jump, panting at rest, licking one area and behaviour changes.',
          'Arrange yearly check-ups, and twice-yearly check-ups for senior dogs.',
          'Keep core vaccinations up to date. Use tick, flea and heartworm prevention as your vet advises; warm, humid regions carry a higher risk.',
          'Brush teeth regularly and provide safe dental chews.',
          'Keep your dog lean. A healthy weight protects joints and may add years of life.',
          'Seek urgent help for collapse, difficulty breathing, a swollen hard belly or suspected poisoning.'
        ], [
          '疼痛的徵狀包括跛行、不願走動或跳躍、靜止時喘氣、不斷舔同一位置及行為改變。',
          '每年進行身體檢查；老年犬應每半年檢查一次。',
          '保持核心疫苗最新。按獸醫建議預防壁蝨、跳蚤及心絲蟲；溫暖潮濕的地區風險較高。',
          '定期刷牙，並提供安全的潔齒小食。',
          '保持狗隻身形精瘦。健康的體重能保護關節，甚至延長壽命。',
          '如出現昏倒、呼吸困難、腹部腫脹發硬或懷疑中毒，須立即求診。'
        ])
      },
      items: [
        { id: 'h1', text: L('No signs of injury, illness or pain', '沒有受傷、疾病或疼痛的跡象') },
        { id: 'h2', text: L('Vaccinations and parasite control are up to date', '疫苗及防寄生蟲措施保持最新') },
        { id: 'h3', text: L('Healthy coat, skin, eyes, ears and teeth', '毛髮、皮膚、眼、耳及牙齒健康') },
        { id: 'h4', text: L('Good mobility and fitness for its age', '活動能力及體能與年齡相符') },
        { id: 'h5', text: L('Regular veterinary check-ups', '定期接受獸醫檢查') }
      ]
    },
    {
      id: 'behaviour', n: 4, color: '#4C86CF', icon: 'interact',
      name: L('Behavioural Interactions', '行為互動'),
      label: L('Behaviour', '行為互動'),
      short: L('Interactions with the environment, other animals and people: choice, play and companionship.',
               '與環境、其他動物及人的互動：選擇、遊戲和陪伴。'),
      desc: L('Renamed in the 2020 update to stress three kinds of interaction: with the environment, with other animals, and with humans. Restriction, isolation or unpleasant handling cause frustration, boredom, fear and loneliness. Choice, enrichment and positive relationships bring curiosity, playfulness, calm and a sense of control.',
              '於 2020 年更新時改名，以強調三類互動：與環境、與其他動物，以及與人的互動。受限制、被孤立或被不當對待會引起沮喪、沉悶、恐懼和孤單；有選擇、環境豐富化和正面的關係則帶來好奇、玩樂、平靜和自主感。'),
      negative: L(['Frustration', 'Boredom', 'Fear and anxiety', 'Loneliness and isolation', 'Helplessness'],
                  ['沮喪', '沉悶', '恐懼及焦慮', '孤單及孤立', '無助感']),
      positive: L(['Curiosity and engagement', 'Playfulness', 'A sense of choice and control', 'Affectionate companionship', 'Feeling secure with people'],
                  ['好奇及投入', '玩樂', '有選擇和自主感', '親密的陪伴', '與人相處時感到安心']),
      goodConditions: L(['Varied, engaging surroundings', 'Freedom to choose and to avoid', 'Gentle handling and reward-based training', 'Suitable company and play'],
                        ['多變而有趣的環境', '可自由選擇及迴避', '溫和對待及獎勵式訓練', '合適的同伴與遊戲']),
      poorConditions: L(['Barren, unchanging surroundings', 'Being left alone for long periods', 'Punishment or rough handling', 'Forced contact with unfamiliar animals'],
                        ['單調不變的環境', '長時間獨處', '懲罰或粗暴對待', '被迫接觸陌生動物']),
      interactionTypes: L(['With the environment: exploring, sniffing, scratching, foraging', 'With other animals: play, companionship, or the choice to avoid', 'With humans: gentle handling, play, training and affection'],
                          ['與環境：探索、嗅聞、抓撓、覓食', '與其他動物：遊戲、陪伴，或選擇迴避', '與人：溫和對待、遊戲、訓練和親暱']),
      tips: {
        cat: L([
          'Play 2–3 times a day for 10–15 minutes with wand toys that mimic prey. End with a "catch" and a small treat.',
          'Let your cat start and end contact. Most cats prefer short, gentle strokes around the head and cheeks.',
          'Offer sturdy scratching posts, both vertical and horizontal. Scratching is a natural need.',
          'Rotate toys weekly to keep them new and interesting.',
          'Introduce new pets slowly, over days to weeks, starting with scent swapping.',
          'Never punish. It increases fear and damages trust.'
        ], [
          '每日 2 至 3 次、每次 10 至 15 分鐘，用模仿獵物的逗貓棒陪貓玩耍，最後讓牠「捕獲」獵物並給予小獎勵。',
          '讓貓決定何時開始和結束接觸。大部分貓喜歡在頭部和臉頰附近被輕柔、短暫地撫摸。',
          '提供穩固的直立及橫放貓抓板。抓撓是天性需要。',
          '每星期輪替玩具，保持新鮮感。',
          '引入新寵物時要循序漸進，用數天至數星期，由交換氣味開始。',
          '切勿懲罰，懲罰會加深恐懼並破壞信任。'
        ]),
        dog: L([
          'Walk daily and let your dog sniff. Sniffing is mental exercise that dogs find rewarding.',
          'Use reward-based (positive reinforcement) training. Avoid aversive tools and punishment.',
          'Socialise puppies gently with people, dogs, sounds and places, especially between 3 and 14 weeks of age.',
          'Offer play with people and with suitable, friendly dogs, and respect it when your dog wants to leave.',
          'Provide chew toys, puzzle feeders and simple training games for mental enrichment.',
          'Dogs are social. Long periods alone can cause loneliness and separation distress.'
        ], [
          '每日散步，並讓狗隻嗅聞。嗅聞是令狗隻滿足的腦力運動。',
          '採用獎勵式（正向強化）訓練，避免使用厭惡性工具及懲罰。',
          '溫和地讓幼犬接觸不同的人、狗、聲音和地方，尤其在 3 至 14 週大期間。',
          '與狗隻玩耍，並安排牠與友善合適的狗隻互動；當牠想離開時要尊重牠。',
          '提供咬嚼玩具、益智餵食器及簡單的訓練遊戲，豐富腦力。',
          '狗是群居動物。長時間獨處可引致孤單及分離焦慮。'
        ])
      },
      items: [
        { id: 'b1', text: L('Opportunities to explore and engage with surroundings (play, sniffing, scratching)', '有機會探索並與環境互動（遊戲、嗅聞、抓撓）') },
        { id: 'b2', text: L('Positive interactions with people (gentle handling, reward-based training)', '與人有正面的互動（溫和對待、獎勵式訓練）') },
        { id: 'b3', text: L('Appropriate interactions with other animals, or the freedom to avoid them', '與其他動物有適當互動，或可自由選擇迴避') },
        { id: 'b4', text: L('Able to express natural behaviours and make choices', '能表達天性行為並有自主選擇') },
        { id: 'b5', text: L('Free from frustrating restrictions or conflict', '沒有令其沮喪的限制或衝突') }
      ]
    },
    {
      id: 'mental', n: 5, color: '#8A6AD0', icon: 'mind',
      name: L('Mental State', '精神狀態'),
      label: L('Mental state', '精神狀態'),
      short: L('What the animal feels: the overall welfare outcome of Domains 1–4.',
               '動物的感受：第 1 至 4 領域綜合而成的整體福利結果。'),
      desc: L('The mental (affective) state is the animal\'s subjective experience: its feelings. It reflects the combined influence of the other four domains and represents the animal\'s overall welfare state. The goal is not only to reduce negative feelings but also to promote positive ones, so the animal has a good life, a life worth living.',
              '精神（情感）狀態是動物的主觀體驗，即牠的感受。它反映其餘四個領域的綜合影響，代表動物的整體福利狀態。目標不僅是減少負面感受，更要促進正面感受，讓動物擁有美好的生活，一個「值得活的生命」。'),
      negative: L(['Pain and discomfort', 'Fear and anxiety', 'Frustration and boredom', 'Hunger and thirst', 'Loneliness'],
                  ['疼痛及不適', '恐懼及焦慮', '沮喪及沉悶', '飢餓及口渴', '孤單']),
      positive: L(['Comfort and calm', 'Pleasure and joy', 'Curiosity and playfulness', 'Contentment', 'Feeling safe and secure'],
                  ['舒適及平靜', '愉悅及快樂', '好奇及玩樂', '滿足', '感到安全及安心']),
      goodConditions: L(['Domains 1–4 well provided for', 'Negative experiences kept brief and mild', 'Daily opportunities for positive experiences'],
                        ['第 1 至 4 領域得到妥善照顧', '負面經歷短暫而輕微', '每日都有正面體驗的機會']),
      poorConditions: L(['Problems in Domains 1–4 left unaddressed', 'Frequent or prolonged fear, pain or stress', 'Few positive experiences'],
                        ['第 1 至 4 領域的問題未獲處理', '經常或長期處於恐懼、疼痛或壓力', '甚少正面體驗']),
      tips: {
        cat: L([
          'Positive signs: slow blinks, a relaxed body, tail held up when greeting, kneading, play, and purring while relaxed.',
          'Warning signs: hiding more, flattened ears, dilated pupils, over-grooming, toileting outside the box, and reduced appetite.',
          'Small changes in routine or behaviour are often the first clue that something is wrong.',
          'Give choice and control. Let your cat approach you and decide when contact ends.',
          'Keep routines consistent. Predictability reduces anxiety.'
        ], [
          '正面跡象：慢慢眨眼、身體放鬆、打招呼時尾巴豎起、踩奶、玩耍，以及在放鬆時發出呼嚕聲。',
          '警號：躲藏增多、耳朵向後壓平、瞳孔放大、過度理毛、在貓砂盆外如廁，以及食慾下降。',
          '作息或行為的細微改變，往往是出現問題的第一個線索。',
          '給予選擇和控制權：讓貓主動接近你，並由牠決定何時結束接觸。',
          '保持作息一致。可預測的生活能減輕焦慮。'
        ]),
        dog: L([
          'Positive signs: a loose, wiggly body, soft eyes, a relaxed open mouth, play bows, and seeking contact.',
          'Stress signals: lip licking, yawning out of context, "whale eye" (showing the whites of the eyes), tucked tail, pinned ears, trembling and pacing.',
          'Repeated or ongoing stress signals deserve attention. Talk to your vet or a qualified behaviourist.',
          'Reward-based training builds confidence and trust.',
          'Predictable routines and a safe place to retreat to reduce anxiety.'
        ], [
          '正面跡象：身體放鬆擺動、眼神柔和、嘴巴放鬆微張、做出「邀玩」姿勢，以及主動尋求接觸。',
          '壓力訊號：舔嘴唇、不合時宜地打呵欠、「鯨魚眼」（露出眼白）、夾尾、耳朵後壓、顫抖及來回踱步。',
          '反覆或持續的壓力訊號值得關注，請諮詢獸醫或合資格的行為專家。',
          '獎勵式訓練能建立自信和信任。',
          '可預測的作息和可退避的安全空間能減輕焦慮。'
        ])
      },
      items: [
        { id: 'm1', text: L('Appears relaxed, comfortable and content', '看起來放鬆、舒適和滿足') },
        { id: 'm2', text: L('Shows playfulness, curiosity and interest', '表現出玩樂、好奇和興趣') },
        { id: 'm3', text: L('No signs of fear, anxiety or stress', '沒有恐懼、焦慮或緊張的跡象') },
        { id: 'm4', text: L('No signs of pain, hunger, thirst or discomfort', '沒有疼痛、飢餓、口渴或不適的跡象') },
        { id: 'm5', text: L('Seeks affection and enjoys companionship', '主動尋求親近並享受陪伴') },
        { id: 'm6', text: L('Free from boredom, frustration or loneliness', '沒有沉悶、沮喪或孤單的表現') }
      ]
    }
  ];

  // Which species tips (by index) help with each welfare-check statement: [cat, dog]
  const itemTips = {
    n1: [[0, 5], [0, 5]], n2: [[2], [2]], n3: [[3, 1], [1, 3]], n4: [[1, 4], [3]],
    e1: [[0], [0, 1]], e2: [[2, 3, 4], [3, 0]], e3: [[2], [2]], e4: [[1], [0]], e5: [[5], [4]],
    h1: [[0, 1], [0, 5]], h2: [[3], [2]], h3: [[4], [3]], h4: [[0], [4, 0]], h5: [[2, 5], [1]],
    b1: [[0, 3], [0, 4]], b2: [[1, 5], [1]], b3: [[4], [3, 2]], b4: [[2, 1], [0]], b5: [[5, 3], [5, 4]],
    m1: [[4], [4]], m2: [[0], [0]], m3: [[3, 1], [1, 2]], m4: [[2], [2]], m5: [[3], [3]], m6: [[3], [4]]
  };
  domains.forEach((d) => d.items.forEach((it) => {
    const m = itemTips[it.id] || [[], []];
    it.tips = { cat: m[0], dog: m[1] };
  }));

  const breeds = {
    cat: [
      ['mixed', 'Mixed / Domestic Shorthair', '唐貓／家貓（短毛）'],
      ['dlh', 'Domestic Longhair', '家貓（長毛）'],
      ['british', 'British Shorthair', '英國短毛貓'],
      ['american', 'American Shorthair', '美國短毛貓'],
      ['scottish', 'Scottish Fold', '蘇格蘭摺耳貓'],
      ['persian', 'Persian', '波斯貓'],
      ['exotic', 'Exotic Shorthair', '異國短毛貓（加菲貓）'],
      ['ragdoll', 'Ragdoll', '布偶貓'],
      ['mainecoon', 'Maine Coon', '緬因貓'],
      ['siamese', 'Siamese', '暹羅貓'],
      ['bengal', 'Bengal', '孟加拉貓'],
      ['russianblue', 'Russian Blue', '俄羅斯藍貓'],
      ['abyssinian', 'Abyssinian', '阿比西尼亞貓'],
      ['sphynx', 'Sphynx', '斯芬克斯貓（無毛貓）'],
      ['norwegian', 'Norwegian Forest Cat', '挪威森林貓'],
      ['munchkin', 'Munchkin', '曼赤肯貓（短腳貓）'],
      ['birman', 'Birman', '伯曼貓'],
      ['devonrex', 'Devon Rex', '德文捲毛貓'],
      ['burmese', 'Burmese', '緬甸貓'],
      ['siberian', 'Siberian', '西伯利亞貓'],
      ['other', 'Other', '其他']
    ],
    dog: [
      ['mixed', 'Mixed breed', '唐狗／混種犬'],
      ['poodle', 'Poodle (Toy / Miniature)', '貴婦狗（貴賓犬）'],
      ['pomeranian', 'Pomeranian', '松鼠狗（博美犬）'],
      ['shiba', 'Shiba Inu', '柴犬'],
      ['chihuahua', 'Chihuahua', '芝娃娃'],
      ['corgi', 'Welsh Corgi', '哥基犬（柯基）'],
      ['schnauzer', 'Miniature Schnauzer', '史納莎（雪納瑞）'],
      ['shihtzu', 'Shih Tzu', '西施犬'],
      ['maltese', 'Maltese', '馬爾濟斯'],
      ['yorkie', 'Yorkshire Terrier', '約瑟爹利（約克夏㹴）'],
      ['frenchie', 'French Bulldog', '法國鬥牛犬'],
      ['bichon', 'Bichon Frise', '比熊犬'],
      ['golden', 'Golden Retriever', '金毛尋回犬'],
      ['labrador', 'Labrador Retriever', '拉布拉多尋回犬'],
      ['gsd', 'German Shepherd', '德國牧羊犬'],
      ['border', 'Border Collie', '邊境牧羊犬'],
      ['husky', 'Siberian Husky', '西伯利亞雪橇犬（哈士奇）'],
      ['beagle', 'Beagle', '比高犬（米格魯）'],
      ['dachshund', 'Dachshund', '臘腸狗'],
      ['samoyed', 'Samoyed', '薩摩耶'],
      ['pug', 'Pug', '八哥犬'],
      ['cocker', 'Cocker Spaniel', '曲架犬（可卡）'],
      ['jackrussell', 'Jack Russell Terrier', '積羅素㹴'],
      ['other', 'Other', '其他']
    ]
  };

  const checklist = {
    cat: [
      ['c_litter', 'Litter boxes = number of cats + 1, scooped daily', '貓砂盆數量＝貓隻數目＋1，每日清理'],
      ['c_separate', 'Food, water and litter in separate locations', '食物、水和貓砂盆分開擺放'],
      ['c_scratch', 'Sturdy scratching posts (vertical and horizontal)', '穩固的貓抓板／貓抓柱（直立及橫放）'],
      ['c_vertical', 'High places: cat tree, shelves or window perch', '高處空間：貓爬架、層架或窗台'],
      ['c_hide', 'Hiding places and a safe retreat (boxes, covered bed)', '可躲藏的安全空間（紙箱、有蓋貓窩）'],
      ['c_window', 'Windows and balconies secured with screens or netting', '窗戶及露台已安裝防護網'],
      ['c_toxic', 'No toxic plants (e.g. lilies) or hazards (strings, chemicals)', '沒有有毒植物（如百合）或危險物品（繩線、化學品）'],
      ['c_temp', 'Comfortable temperature and draft-free resting spots', '溫度舒適，休息處沒有風口'],
      ['c_toys', 'Rotating toys and daily play opportunities', '輪替玩具，每日有遊戲機會'],
      ['c_quiet', 'A quiet area away from noise and busy foot traffic', '遠離噪音及人流的寧靜角落']
    ],
    dog: [
      ['d_bed', 'Comfortable bed in a quiet, draft-free spot', '在寧靜、無風處有舒適的床'],
      ['d_retreat', 'A safe retreat or den the dog can choose to use', '有可自行選擇使用的安全休息角落'],
      ['d_water', 'Fresh water available at all times, including outdoors', '隨時（包括戶外）可喝到清水'],
      ['d_heat', 'Protection from heat: shade, cooling, walks at cooler times', '防暑：遮蔭、降溫，並在較涼時段散步'],
      ['d_secure', 'Secure home; hazards and toxins out of reach', '居所安全，危險及有毒物品放於接觸不到的地方'],
      ['d_floor', 'Non-slip floors or rugs (especially for puppies and seniors)', '防滑地板或地毯（尤其是幼犬及老犬）'],
      ['d_walk', 'Daily walks with time to sniff and explore', '每日散步，並有時間嗅聞探索'],
      ['d_toys', 'Chew toys and puzzle feeders available', '提供咬嚼玩具及益智餵食器'],
      ['d_noise', 'A plan for loud events (fireworks, thunderstorms)', '為巨響事件（煙花、雷暴）作好準備'],
      ['d_clean', 'Clean toileting area or regular toilet breaks', '清潔的如廁區域或定時如廁']
    ]
  };

  // Body Condition Score, 9-point scale
  const bcs = [
    { s: 1, name: L('Emaciated', '極度消瘦'), group: 'under' },
    { s: 2, name: L('Very thin', '非常瘦'), group: 'under' },
    { s: 3, name: L('Thin', '偏瘦'), group: 'under' },
    { s: 4, name: L('Ideal (lean)', '理想（偏瘦）'), group: 'ideal' },
    { s: 5, name: L('Ideal', '理想'), group: 'ideal' },
    { s: 6, name: L('Overweight', '略為過重'), group: 'over' },
    { s: 7, name: L('Heavy', '過重'), group: 'over' },
    { s: 8, name: L('Obese', '肥胖'), group: 'obese' },
    { s: 9, name: L('Severely obese', '嚴重肥胖'), group: 'obese' }
  ];
  const bcsGroups = {
    under: L('Ribs, spine and hip bones are easily seen or felt, with little or no fat. Muscle loss may be visible.', '肋骨、脊骨及盤骨清晰可見或容易摸到，幾乎沒有脂肪，可能出現肌肉流失。'),
    ideal: L('Ribs are easily felt under a thin fat layer. Waist visible from above; belly tucked up from the side.', '隔著薄薄的脂肪可輕易摸到肋骨。從上方看見腰身，從側面看腹部收起。'),
    over: L('Ribs are hard to feel under moderate fat. Waist barely visible; little abdominal tuck.', '肋骨被中等脂肪覆蓋，難以摸到。腰身不明顯，腹部幾乎沒有收起。'),
    obese: L('Ribs cannot be felt under heavy fat. No waist; belly rounded or sagging, with fat deposits.', '厚厚的脂肪令肋骨無法摸到。沒有腰身，腹部渾圓或下垂，並有脂肪堆積。')
  };

  // Maintenance energy factors (multiples of RER). Estimates only.
  const energyFactors = {
    cat: [
      ['neutered', 1.2, 'Neutered adult', '已絕育成貓'],
      ['intact', 1.4, 'Intact adult', '未絕育成貓'],
      ['inactive', 1.0, 'Inactive / prone to weight gain', '活動量少／容易發胖'],
      ['loss', 0.8, 'Weight loss (use ideal weight)', '減重（以理想體重計算）'],
      ['young', 2.5, 'Kitten (growing)', '幼貓（成長期）']
    ],
    dog: [
      ['neutered', 1.6, 'Neutered adult', '已絕育成犬'],
      ['intact', 1.8, 'Intact adult', '未絕育成犬'],
      ['inactive', 1.4, 'Inactive / prone to weight gain', '活動量少／容易發胖'],
      ['loss', 1.0, 'Weight loss (use ideal weight)', '減重（以理想體重計算）'],
      ['puppy4', 3.0, 'Puppy under 4 months', '4 個月以下幼犬'],
      ['young', 2.0, 'Puppy 4–12 months', '4 至 12 個月幼犬'],
      ['active', 2.0, 'Active / light working dog', '活躍／輕度工作犬']
    ]
  };

  const medicalCategories = [
    ['diagnosis', 'Diagnosis / condition', '診斷／疾病'],
    ['checkup', 'Check-up / vet visit', '健康檢查／求診'],
    ['surgery', 'Surgery / procedure', '手術／程序'],
    ['injury', 'Injury', '受傷'],
    ['allergy', 'Allergy', '過敏'],
    ['lab', 'Test / lab result', '化驗／檢查結果'],
    ['other', 'Other', '其他']
  ];
  const medicalStatus = [
    ['active', 'Active', '治療中'],
    ['chronic', 'Chronic / ongoing', '長期病患'],
    ['monitoring', 'Monitoring', '觀察中'],
    ['resolved', 'Resolved', '已痊癒']
  ];
  const treatmentTypes = [
    ['vaccination', 'Vaccination', '疫苗接種', '💉'],
    ['parasite', 'Parasite control', '驅蟲／防寄生蟲', '🛡️'],
    ['medication', 'Medication', '藥物', '💊'],
    ['dental', 'Dental care', '牙科護理', '🦷'],
    ['surgery', 'Surgery', '手術', '🩹'],
    ['therapy', 'Therapy / rehab', '治療／復康', '🫶'],
    ['supplement', 'Supplement', '營養補充品', '🌿'],
    ['other', 'Other', '其他', '📋']
  ];
  // Activity types, with the 2020 model's interaction partner as default
  const activityTypes = [
    ['walk', 'Walk', '散步', '🦮', 'environment'],
    ['play', 'Play', '遊戲', '🎾', 'humans'],
    ['training', 'Training', '訓練', '🎯', 'humans'],
    ['enrichment', 'Enrichment / puzzle', '益智／豐富化活動', '🧩', 'environment'],
    ['explore', 'Exploring', '探索', '🌿', 'environment'],
    ['social_human', 'Time with people', '與人相處', '🤗', 'humans'],
    ['social_animal', 'Time with other animals', '與其他動物相處', '🐾', 'animals'],
    ['grooming', 'Grooming / handling', '梳理／觸碰練習', '🪮', 'humans'],
    ['other', 'Other', '其他', '✨', 'environment']
  ];
  const interactionWith = [
    ['environment', 'Environment', '環境'],
    ['animals', 'Other animals', '其他動物'],
    ['humans', 'People', '人']
  ];
  const moods = [
    { v: 1, face: '😣', name: L('Distressed', '痛苦') },
    { v: 2, face: '😟', name: L('Unsettled', '不安') },
    { v: 3, face: '😐', name: L('Neutral', '平淡') },
    { v: 4, face: '🙂', name: L('Content', '滿足') },
    { v: 5, face: '😄', name: L('Joyful', '愉快') }
  ];
  const ratingScale = [
    { v: 1, name: L('Major concern', '嚴重關注') },
    { v: 2, name: L('Some concern', '稍有關注') },
    { v: 3, name: L('Adequate', '尚可') },
    { v: 4, name: L('Good', '良好') },
    { v: 5, name: L('Excellent', '優秀') }
  ];
  const grades = [
    { min: 80, key: 'thriving', name: L('Thriving', '蓬勃'), desc: L('Positive experiences clearly outweigh negative ones: a life worth living.', '正面體驗明顯多於負面體驗：一個值得活的生命。') },
    { min: 60, key: 'good', name: L('Good', '良好'), desc: L('Welfare is good, with room to add more positive experiences.', '福利良好，仍可增加更多正面體驗。') },
    { min: 40, key: 'fair', name: L('Fair', '尚可'), desc: L('Basic needs are mostly met. Look for areas to improve.', '基本需要大致得到滿足，可找出需要改善的地方。') },
    { min: 20, key: 'concern', name: L('Concerning', '需關注'), desc: L('Negative experiences are significant. Act on the areas flagged below.', '負面體驗明顯。請針對以下標示的範疇作出改善。') },
    { min: 0, key: 'poor', name: L('Poor', '欠佳'), desc: L('Welfare is seriously compromised. Please seek veterinary advice.', '福利嚴重受損，請盡快尋求獸醫意見。') }
  ];

  // Learn section topics
  const learn = [
    {
      id: 'overview', emoji: '🧭',
      title: L('What is the Five Domains Model?', '甚麼是五大領域模型？'),
      sub: L('The big picture of animal welfare', '動物福利的整體概念'),
      blocks: [
        { p: L('The Five Domains Model is a framework for understanding and assessing animal welfare. David Mellor and Christopher Reid, animal welfare scientists in New Zealand, first proposed it in 1994, and it has been refined several times since.',
               '五大領域模型（Five Domains Model）是用以理解和評估動物福利的框架。紐西蘭動物福利學者 David Mellor 與 Christopher Reid 於 1994 年首次提出，其後經歷多次修訂。') },
        { p: L('The model looks at four physical and functional domains (Nutrition, Physical Environment, Health and Behavioural Interactions). Each of them influences a fifth domain, the Mental State. What the animal feels is its welfare.',
               '模型包含四個「身體及功能」領域：營養、物理環境、健康和行為互動，它們共同影響第五個領域：精神狀態。動物的感受，就是牠的福利。') },
        { diagram: 'model' },
        { h: L('Key ideas', '核心概念') },
        { list: L([
          'Welfare is about the animal\'s experience. Food, a comfortable home, good health and positive interactions matter because of how they make the animal feel.',
          'Welfare ranges from very negative to very positive, not simply "good" or "bad".',
          'Negative experiences can never be removed completely, but they can be kept brief and mild.',
          'Positive experiences should be actively provided, not just the absence of suffering.',
          'The overall balance decides whether an animal has "a life worth living".'
        ], [
          '福利關乎動物的體驗。食物、舒適的家、健康和正面的互動之所以重要，是因為它們影響動物的感受。',
          '福利由非常負面延伸至非常正面，不只是「好」或「壞」。',
          '負面經歷永遠無法完全消除，但可以盡量令其短暫和輕微。',
          '應主動提供正面體驗，而不僅僅是沒有痛苦。',
          '正負體驗的整體平衡，決定動物是否擁有「值得活的生命」。'
        ]) }
      ]
    },
    {
      id: 'history', emoji: '📜',
      title: L('History and development', '歷史與發展'),
      sub: L('From the Five Freedoms to the 2020 model', '由五大自由到 2020 年模型'),
      blocks: [
        { p: L('The model has grown from a tool for assessing welfare in research animals into a framework used for farm, zoo, wild and companion animals.',
               '這個模型由最初評估研究用動物福利的工具，逐步發展為適用於農場動物、動物園動物、野生動物及伴侶動物的框架。') },
        { timeline: [
          { y: '1979', t: L('The UK Farm Animal Welfare Council sets out the Five Freedoms, which shape welfare thinking for decades.', '英國農場動物福利委員會提出「五大自由」，影響動物福利思維數十年。') },
          { y: '1994', t: L('Mellor and Reid propose the Five Domains Model to assess welfare compromise in animals used in research, teaching and testing.', 'Mellor 與 Reid 提出五大領域模型，用以評估在研究、教學及測試中所使用動物的福利受損程度。') },
          { y: '2000s', t: L('The model is refined and applied more widely, with growing focus on the animal\'s mental experiences.', '模型經修訂並更廣泛應用，愈來愈重視動物的精神體驗。') },
          { y: '2015', t: L('Mellor and Beausoleil extend the model to include positive welfare states, not just the reduction of suffering.', 'Mellor 與 Beausoleil 擴展模型，納入正面福利狀態，而不僅是減少痛苦。') },
          { y: '2017', t: L('Mellor publishes detailed guidance on how to apply the model in welfare assessment and management.', 'Mellor 發表詳細指引，說明如何在福利評估及管理中應用此模型。') },
          { y: '2020', t: L('The 2020 update renames Domain 4 "Behavioural Interactions" and explicitly includes human–animal interactions.', '2020 年更新把第 4 領域改名為「行為互動」，並明確納入人與動物之間的互動。') }
        ] },
        { h: L('Survival-related and situation-related factors', '與生存相關及與處境相關的因素') },
        { p: L('In the 2020 model, Domains 1–3 (Nutrition, Physical Environment, Health) are described as survival-related factors. Domain 4 (Behavioural Interactions) covers situation-related factors: how the animal perceives and responds to its surroundings, other animals and people.',
               '在 2020 年模型中，第 1 至 3 領域（營養、物理環境、健康）被視為「與生存相關」的因素；第 4 領域（行為互動）則涵蓋「與處境相關」的因素，即動物如何感知及回應其環境、其他動物和人。') }
      ]
    },
    { id: 'nutrition', domain: 'nutrition' },
    { id: 'environment', domain: 'environment' },
    { id: 'health', domain: 'health' },
    { id: 'behaviour', domain: 'behaviour' },
    { id: 'mental', domain: 'mental' },
    {
      id: 'freedoms', emoji: '⚖️',
      title: L('Five Freedoms vs Five Domains', '五大自由與五大領域的比較'),
      sub: L('How welfare thinking has evolved', '動物福利思維的演變'),
      blocks: [
        { p: L('The Five Freedoms (1979) were a landmark. They are:', '1979 年提出的「五大自由」是一個里程碑，內容包括：') },
        { list: L([
          'Freedom from hunger and thirst',
          'Freedom from discomfort',
          'Freedom from pain, injury or disease',
          'Freedom to express normal behaviour',
          'Freedom from fear and distress'
        ], [
          '免受飢餓和口渴的自由',
          '免受不適的自由',
          '免受疼痛、傷害或疾病的自由',
          '表達天性行為的自由',
          '免受恐懼和困擾的自由'
        ]) },
        { p: L('The Five Domains Model builds on this foundation, with some important differences:', '五大領域模型建基於此，但有幾點重要分別：') },
        { table: {
          head: [L('', ''), L('Five Freedoms', '五大自由'), L('Five Domains', '五大領域')],
          rows: [
            [L('Focus', '重點'), L('Avoiding negative states', '避免負面狀態'), L('Balance of negative and positive experiences', '負面與正面體驗的平衡')],
            [L('Goal', '目標'), L('Absolute "freedom from" problems, which is hard to achieve fully', '完全「免於」問題，但實際上難以完全做到'), L('Minimise negatives and actively promote positives', '盡量減少負面，並主動促進正面')],
            [L('Mental state', '精神狀態'), L('Implied', '隱含其中'), L('Central: Domain 5 is the welfare outcome', '核心：第 5 領域就是福利結果')],
            [L('Positive welfare', '正面福利'), L('Limited', '著墨不多'), L('A core component (since 2015)', '核心部分（自 2015 年起）')],
            [L('Human–animal interactions', '人與動物的互動'), L('Not explicit', '沒有明確提及'), L('Explicitly included (2020)', '明確納入（2020 年）')]
          ]
        } }
      ]
    },
    {
      id: 'positive', emoji: '🌈',
      title: L('Positive welfare: a life worth living', '正面福利：值得活的生命'),
      sub: L('Going beyond preventing suffering', '超越防止痛苦'),
      blocks: [
        { p: L('Good welfare is more than the absence of pain, fear or hunger. Animals also benefit from pleasure, comfort, curiosity, play and companionship. The modern Five Domains Model asks two questions: are negative experiences kept to a minimum, and are positive experiences being provided?',
               '良好的福利不只是沒有疼痛、恐懼或飢餓。動物同樣需要愉悅、舒適、好奇、遊戲和陪伴。現代五大領域模型會問兩個問題：負面經歷是否已減至最少？正面體驗是否得到提供？') },
        { h: L('Everyday ways to add positive experiences', '日常增加正面體驗的方法') },
        { list: L([
          'Offer choices: different resting places, toys, and the option to say "no" to contact.',
          'Make food interesting with puzzle feeders, foraging and safe variety.',
          'Play every day in ways that suit the species: hunting games for cats, sniffing and fetch for dogs.',
          'Use gentle handling and reward-based training to build trust.',
          'Provide comfort: soft bedding, warmth or cool spots, and quiet time.',
          'Keep routines predictable while adding safe novelty.'
        ], [
          '提供選擇：不同的休息處、玩具，以及拒絕被觸碰的權利。',
          '以益智餵食器、覓食遊戲和安全的食物變化，令進食更有趣。',
          '每日以合適的方式遊戲：貓玩狩獵遊戲，狗玩嗅聞和拾回遊戲。',
          '溫和對待並採用獎勵式訓練，建立信任。',
          '提供舒適：柔軟的床、溫暖或清涼的角落和安靜的時間。',
          '保持作息可預測，同時加入安全的新鮮事物。'
        ]) },
        { p: L('In PetsDB, the welfare check scores each domain from 0 to 100. Scores near 50 suggest basic needs are met. Higher scores mean your pet is enjoying more positive experiences.',
               '在 PetsDB 中，福利評估會為每個領域評分（0 至 100）。50 分左右代表基本需要大致得到滿足；分數愈高，代表寵物享有愈多正面體驗。') }
      ]
    },
    {
      id: 'app', emoji: '📱',
      title: L('How PetsDB uses the model', 'PetsDB 如何應用此模型'),
      sub: L('Every feature belongs to a domain', '每項功能都對應一個領域'),
      blocks: [
        { p: L('PetsDB organises each pet\'s records around the Five Domains, so everyday record-keeping becomes a picture of your pet\'s welfare.',
               'PetsDB 以五大領域整理每隻寵物的紀錄，讓日常記錄成為反映寵物福利的整體圖像。') },
        { mapping: true },
        { h: L('Doing a welfare check', '進行福利評估') },
        { list: L([
          'Rate each statement from 1 (major concern) to 5 (excellent), based on what you observe.',
          'Each domain gets a score from 0 to 100.',
          'Score Domains 1–4 first, then think about how they make your pet feel. Domain 5 (Mental State) represents your pet\'s overall welfare.',
          'Repeat every month or so, and after any big change such as moving home, illness or a new pet, to see trends.',
          'PetsDB suggests improvements for any low-scoring areas.'
        ], [
          '根據你的觀察，為每項陳述評分：1（嚴重關注）至 5（優秀）。',
          '每個領域會得出 0 至 100 的分數。',
          '先評估第 1 至 4 領域，再思考它們如何影響寵物的感受。第 5 領域（精神狀態）代表寵物的整體福利。',
          '建議每月評估一次，並在搬家、患病或家中有新寵物等重大轉變後再次評估，以觀察趨勢。',
          'PetsDB 會為分數較低的範疇提供改善建議。'
        ]) },
        { note: L('PetsDB is an educational and record-keeping tool. It does not replace professional veterinary advice. If you are worried about your pet\'s health or welfare, contact your veterinarian.',
                  'PetsDB 是教育及紀錄工具，不能取代專業獸醫意見。如擔心寵物的健康或福利，請聯絡你的獸醫。') }
      ]
    },
    {
      id: 'references', emoji: '📚',
      title: L('References', '參考資料'),
      sub: L('Key publications', '主要文獻'),
      blocks: [
        { refs: [
          'Mellor DJ, Reid CSW (1994). Concepts of animal well-being and predicting the impact of procedures on experimental animals. In: Improving the Well-being of Animals in the Research Environment. ANZCCART, Glen Osmond, South Australia, pp. 3–18.',
          'Mellor DJ, Beausoleil NJ (2015). Extending the "Five Domains" model for animal welfare assessment to incorporate positive welfare states. Animal Welfare 24: 241–253.',
          'Mellor DJ (2017). Operational details of the Five Domains Model and its key applications to the assessment and management of animal welfare. Animals 7(8): 60.',
          'Mellor DJ, Beausoleil NJ, Littlewood KE, McLean AN, McGreevy PD, Jones B, Wilkins C (2020). The 2020 Five Domains Model: Including Human–Animal Interactions in Assessments of Animal Welfare. Animals 10(10): 1870.',
          'Farm Animal Welfare Council (1979). Press statement: the Five Freedoms. London, UK.',
          'Ellis SLH, Rodan I, Carney HC, et al. (2013). AAFP and ISFM Feline Environmental Needs Guidelines. Journal of Feline Medicine and Surgery 15: 219–230.',
          'WSAVA Global Nutrition Committee (2011). WSAVA Nutritional Assessment Guidelines. Journal of Small Animal Practice 52: 385–396.'
        ] },
        { note: L('Educational content in PetsDB is a simplified summary for pet owners. Always follow the advice of your veterinarian.',
                  'PetsDB 的教育內容是為寵物主人而設的簡化摘要，請以獸醫的意見為準。') }
      ]
    }
  ];

  const toObjs = (arr) => arr.map(([id, en, zh, icon, extra]) => ({ id, name: L(en, zh), icon, extra }));

  window.PETSDB_CONTENT = {
    domains,
    breeds: { cat: toObjs(breeds.cat), dog: toObjs(breeds.dog) },
    checklist: { cat: toObjs(checklist.cat), dog: toObjs(checklist.dog) },
    bcs, bcsGroups,
    energyFactors: {
      cat: energyFactors.cat.map(([id, f, en, zh]) => ({ id, f, name: L(en, zh) })),
      dog: energyFactors.dog.map(([id, f, en, zh]) => ({ id, f, name: L(en, zh) }))
    },
    medicalCategories: toObjs(medicalCategories),
    medicalStatus: toObjs(medicalStatus),
    treatmentTypes: toObjs(treatmentTypes),
    activityTypes: activityTypes.map(([id, en, zh, icon, w]) => ({ id, name: L(en, zh), icon, with: w })),
    interactionWith: toObjs(interactionWith),
    moods, ratingScale, grades, learn
  };
})();
