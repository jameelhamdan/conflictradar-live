"""
Pre-downloads all ML models used at runtime into the HF cache.
Run during Docker build (as root, before switching to djangouser) so the
worker/api containers never need network access or write permission to HF_HOME.
"""
from transformers import pipeline
from sentence_transformers import SentenceTransformer

print("Downloading dslim/bert-base-NER...")
pipeline("token-classification", model="dslim/bert-base-NER", aggregation_strategy="simple")

print("Downloading paraphrase-multilingual-MiniLM-L12-v2...")
SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

print("All models downloaded.")
