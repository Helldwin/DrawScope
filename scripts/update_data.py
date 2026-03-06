import requests
import pandas as pd
import json
import random
from collections import Counter
from datetime import datetime

URL = "https://media.fdj.fr/generated/game/loto/loto.csv"

print("Downloading draws...")

df = pd.read_csv(URL)

numbers = []

for col in ["boule_1","boule_2","boule_3","boule_4","boule_5"]:
    numbers += df[col].tolist()

freq = Counter(numbers)

total = sum(freq.values())

scores = {}

for i in range(1,50):
    scores[i] = round(freq.get(i,0)/total*100,3)

print("Running Monte Carlo...")

sim = Counter()

for _ in range(100000):

    draw = tuple(sorted(random.sample(range(1,50),5)))
    sim[draw]+=1

top_sim = sim.most_common(20)

recent = df.tail(10)[
["boule_1","boule_2","boule_3","boule_4","boule_5"]
].values.tolist()

data = {

"last_update":datetime.now().strftime("%Y-%m-%d"),

"scores":scores,

"montecarlo":[

{
"numbers":list(k),
"score":v
}

for k,v in top_sim

],

"recent_draws":recent

}

with open("data/data.json","w") as f:

    json.dump(data,f,indent=2)

print("data.json updated")
