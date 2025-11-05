import json, boto3, time
from decimal import Decimal

TABLE = "hawker_centres"
FILENAME = "centres_min.json"

dynamo = boto3.resource("dynamodb")
table = dynamo.Table(TABLE)

def to_decimal(value):
    """Recursively convert floats/ints to Decimal for DynamoDB."""
    if isinstance(value, list):
        return [to_decimal(v) for v in value]
    elif isinstance(value, dict):
        return {k: to_decimal(v) for k, v in value.items()}
    elif isinstance(value, float) or isinstance(value, int):
        # Convert all numbers to string first to avoid binary error
        return Decimal(str(value))
    else:
        return value

with open(FILENAME, "r", encoding="utf-8") as f:
    centres = json.load(f)

for c in centres:
    c["id"] = int(c["id"])
    c["lat"] = Decimal(str(c["lat"]))
    c["lon"] = Decimal(str(c["lon"]))

print(f"Uploading {len(centres)} centres to {TABLE}...")

count = 0
with table.batch_writer(overwrite_by_pkeys=["id"]) as batch:
    for item in centres:
        batch.put_item(Item=to_decimal(item))
        count += 1

print(f"Done. Inserted {count} items.")
