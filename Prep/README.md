# Hawker Centres Data Preparation

This folder contains scripts and data for preparing Singapore hawker centre information for the Hawker Challenge Game.

## Files Overview

### Source Data
- **`Hawker_Centres__GEOJSON_.geojson`** - Raw GeoJSON data from Singapore government open data
- **`Hawker_Centres__KML_.kml`** - Alternative KML format (not used in current workflow)

### Processed Data
- **`centres_min.json`** - Cleaned and formatted hawker centre data (JSON format)
- **`centres_seed.csv`** - Same data in CSV format for easy viewing/importing

### Scripts
- **`extractJSON.py`** - Extracts and cleans data from GeoJSON to JSON/CSV
- **`uploadChallenges.py`** - Uploads processed data to DynamoDB

## Data Pipeline

```
Hawker_Centres__GEOJSON_.geojson
           ↓
    extractJSON.py
           ↓
  centres_min.json + centres_seed.csv
           ↓
   uploadChallenges.py
           ↓
      DynamoDB Table
```

##  Usage

### Step 1: Extract and Clean Data

```bash
python extractJSON.py
```

**What it does:**
- Reads `Hawker_Centres__GEOJSON_.geojson`
- Filters for existing hawker centres only
- Validates coordinates are within Singapore bounds (lat: 1.15-1.48, lon: 103.60-104.10)
- Creates URL-friendly slugs for each centre
- Removes duplicates
- Sorts alphabetically by name
- Outputs:
  - `centres_min.json` - For frontend/API use
  - `centres_seed.csv` - For easy viewing/database seeding

### Step 2: Upload to DynamoDB

```bash
python uploadChallenges.py
```

**What it does:**
- Reads `centres_min.json`
- Converts floats to Decimal (DynamoDB requirement)
- Batch uploads to `hawker_centres` DynamoDB table
- Overwrites existing entries with same ID

**Prerequisites:**
- AWS credentials configured (`aws configure`)
- DynamoDB table `hawker_centres` created
- Appropriate IAM permissions

## Data Structure

Each hawker centre record contains:

```json
{
  "id": 119069,                                    // Unique identifier (OBJECTID from source)
  "name": "Adam Road Food Centre",                 // Official hawker centre name
  "lat": 1.3241598522323794,                      // Latitude
  "lon": 103.81416592401631,                      // Longitude
  "postal_code": "289876",                         // Singapore postal code
  "street": "Adam Road",                           // Street name
  "status": "Existing",                            // Status (all are "Existing" after filtering)
  "slug": "adam-road-food-centre"                  // URL-friendly identifier
}
```

## Requirements

### Python Dependencies

```bash
pip install boto3
```

**Built-in modules used:**
- json
- re
- csv
- time
- decimal

### AWS Configuration

**DynamoDB Table Schema:**
```
Table Name: hawker_centres
Partition Key: id (Number)

Attributes:
- id: Number
- name: String
- lat: Number (Decimal)
- lon: Number (Decimal)
- postal_code: String
- street: String
- status: String
- slug: String
```

**Create table with AWS CLI:**
```bash
aws dynamodb create-table \
  --table-name hawker_centres \
  --attribute-definitions AttributeName=id,AttributeType=N \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

## Data Statistics

After processing (as of last update):
- **Total Centres:** 123 existing hawker centres
- **Coverage:** All of Singapore
- **Status Filter:** Only "Existing" centres included (excludes planned/closed)

## Data Cleaning Rules

### `extractJSON.py` Filters:

1. **Geometry Validation**
   - Must be Point geometry
   - Must have exactly 2 coordinates [lon, lat]

2. **Coordinate Bounds**
   - Latitude: 1.15 to 1.48
   - Longitude: 103.60 to 104.10
   - Ensures all points are within Singapore

3. **Status Filter**
   - Only includes centres with status starting with "Existing"
   - Excludes: Planned, Closed, Under Construction

4. **Required Fields**
   - Must have OBJECTID
   - Must have NAME

5. **Duplicate Removal**
   - Removes duplicate OBJECTID entries

### `uploadChallenges.py` Conversions:

1. **Decimal Conversion**
   - All numbers converted to Decimal for DynamoDB compatibility
   - Prevents float precision errors

2. **Batch Upload**
   - Uses batch writer for efficiency
   - Overwrites existing entries (upsert behavior)

## Script Details

### extractJSON.py

**Key Functions:**
- `slugify(s: str) -> str` - Converts centre name to URL-friendly slug
  - Lowercase
  - Removes special characters
  - Replaces spaces with hyphens
  - Removes duplicate hyphens

**Input:** `Hawker_Centres__GEOJSON_.geojson`

**Output:**
- `centres_min.json` - Minified JSON (2 space indent)
- `centres_seed.csv` - CSV with headers

### uploadChallenges.py

**Key Functions:**
- `to_decimal(value)` - Recursively converts floats/ints to Decimal
  - Handles nested lists and dicts
  - Converts through string to avoid binary precision errors

**Configuration:**
```python
TABLE = "hawker_centres"      # DynamoDB table name
FILENAME = "centres_min.json" # Input file
```

**Features:**
- Batch writing for performance
- Progress counter
- Overwrite mode (upsert)

## Updating Data

When government data is updated:

1. Download new GeoJSON from [data.gov.sg](https://data.gov.sg/)
2. Replace `Hawker_Centres__GEOJSON_.geojson`
3. Run `python extractJSON.py`
4. Review changes in `centres_min.json` or `centres_seed.csv`
5. Run `python uploadChallenges.py`

## Troubleshooting

### Error: "No such file or directory"
**Solution:** Ensure you're in the correct directory with all required files

### Error: "Unable to locate credentials"
**Solution:** Configure AWS credentials:
```bash
aws configure
```

### Error: "ResourceNotFoundException: Table not found"
**Solution:** Create the DynamoDB table first (see AWS Configuration section)

### Error: "An error occurred (ValidationException)"
**Solution:** Check that your data types match the table schema

### Warning: "Duplicate OBJECTID"
**Solution:** Already handled by script - duplicates are automatically filtered

## Data Source

**Original Data:** Singapore Government Open Data Portal
- Dataset: Hawker Centres
- Format: GeoJSON / KML
- License: Singapore Open Data License
- URL: https://data.gov.sg/

## Security Notes

- ⚠️ Never commit AWS credentials to git
- ⚠️ Keep AWS credentials in `~/.aws/credentials`
- ✅ Use IAM roles when possible
- ✅ Follow principle of least privilege

## Git Repository Structure

```
hawker-data-prep/
├── README.md
├── extractJSON.py
├── uploadChallenges.py
├── requirements.txt
├── Hawker_Centres__GEOJSON_.geojson
├── Hawker_Centres__KML_.kml
├── centres_min.json
└── centres_seed.csv
```

## Use Cases

### Frontend Integration
Use `centres_min.json` to:
- Display markers on map
- Populate dropdown selections
- Show hawker centre names and locations

### Backend Integration
Use DynamoDB table to:
- Validate user guesses
- Store challenge data with centre references
- Query nearby centres

### Data Analysis
Use `centres_seed.csv` to:
- Analyze distribution of hawker centres
- Create visualizations
- Import into Excel/Google Sheets

## Quick Start

```bash
# 1. Install dependencies
pip install boto3

# 2. Configure AWS credentials
aws configure

# 3. Create DynamoDB table
aws dynamodb create-table \
  --table-name hawker_centres \
  --attribute-definitions AttributeName=id,AttributeType=N \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# 4. Extract data from GeoJSON
python extractJSON.py

# 5. Upload to DynamoDB
python uploadChallenges.py

# Done! 🎉
```

## License

Data provided by Singapore Government under the Singapore Open Data License.

Scripts are provided as-is for the Hawker Challenge Game project.

## Contributing

To contribute improvements:
1. Test changes with a small subset of data first
2. Verify output formats match schema
3. Update this README if adding new features
4. Include example output for new scripts

## Support

For issues related to:
- **Source data:** Check data.gov.sg
- **AWS services:** Check AWS documentation
- **Scripts:** Review error messages and troubleshooting section
