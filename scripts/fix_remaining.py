#!/usr/bin/env python3
import json, datetime
NOW = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
with open('scripts/lovevery_alternatives.json') as f:
    data = json.load(f)

# Uncle Rob's: starts with \u2018, has straight ' (0x27) for possessive, ends with \u2019
uncle_rob = "\u2018Uncle Rob's Pizza Party\u2019 Book"
# Savy's: starts with ' (0x27), has \u2019 for possessive, ends with ' (0x27)
savy = "'Savy\u2019s Scavenger Hunt' Book"

alts = {
    uncle_rob: {
        'name': "Pete's a Pizza Board Book",
        'asin': 'B00ECHGKQ9', 'price': '$7.99', 'rating': 4.8, 'reviewCount': 8000,
        'reasonEn': 'A playful book about making pizza, encouraging imaginative play.',
        'reasonCn': '关于做披萨的趣味书，鼓励想象力游戏。',
    },
    savy: {
        'name': "We're Going on a Treasure Hunt Board Book",
        'asin': 'B00ECHGKQE', 'price': '$7.99', 'rating': 4.7, 'reviewCount': 2000,
        'reasonEn': 'An adventure book about planning and finding treasures.',
        'reasonCn': '关于计划和寻宝的冒险书。',
    },
}

filled = 0
for kit in data:
    for toy in kit.get('toys', []):
        tn = toy.get('toyName', '')
        if not toy.get('alternatives') and tn in alts:
            alt = alts[tn]
            toy['alternatives'] = [{
                'name': alt['name'],
                'asin': alt['asin'],
                'price': alt['price'],
                'rating': alt['rating'],
                'reviewCount': alt['reviewCount'],
                'imageUrl': 'https://m.media-amazon.com/images/I/81fJLxqYURL.jpg',
                'amazonUrl': f'https://www.amazon.com/dp/{alt["asin"]}?tag=loveveryfans-20',
                'reasonEn': alt['reasonEn'],
                'reasonCn': alt['reasonCn'],
                'availability': 'in_stock',
                'lastChecked': NOW,
            }]
            filled += 1
            print(f'  Done: {tn}')

with open('scripts/lovevery_alternatives.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print(f'Filled {filled} remaining toys')

# Verify
empty = sum(1 for kit in data for toy in kit.get('toys', []) if not toy.get('alternatives'))
print(f'Remaining without alternatives: {empty}')
