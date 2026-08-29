# FinanceAI — Dataset & Pipeline

This folder contains a refactored data pipeline extracted from Notebook_EDA.ipynb.

How to run (locally):

1. Place the raw CSVs in data/raw/:
   - financial_transactions.csv
   - personal_finance_ml.csv

2. Create a virtualenv and install dependencies:
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt

3. Run the pipeline:
   python -m src.data.build_dataset_financeai --raw-dir data/raw --processed-dir data/processed --n-users 500 --seed 42

Outputs:
- data/processed/financeai_dataset_hibrido.csv
- data/processed/provenance.json

Notes:
- The implementation vectorizes the scoring logic for performance and includes a provenance file with parameters and git commit if available.
