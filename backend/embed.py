import sys
import json
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

text_list = json.loads(sys.argv[1])
vectors = model.encode(text_list).tolist()
print(json.dumps(vectors))
