from frenchlottery import get_loto_results
import json

raw = get_loto_results()
print("=== RAW LOTO RESULTS ===")
try:
    print(json.dumps(raw, indent=2))
except Exception as e:
    print(raw)
