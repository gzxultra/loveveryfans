import json

with open('lovevery_alternatives.json') as f:
    data = json.load(f)

empty_count = 0
for kit in data:
    for toy in kit.get('toys', []):
        if not toy.get('alternatives'):
            empty_count += 1
            print(f"  [{kit['kitId']}] {toy.get('toyName', '?')} ({toy.get('toyNameCn', '?')})")

print(f"\nTotal toys with empty alternatives: {empty_count}")
