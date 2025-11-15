import json
import boto3
import random
import uuid
from decimal import Decimal
from boto3.dynamodb.conditions import Attr, Key
import traceback
from datetime import datetime
import hashlib

dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")

centres_table = dynamodb.Table("hawker_centres")
challenges_table = dynamodb.Table("challenges")

# NEW: Points & Rewards Tables
user_points_table = dynamodb.Table("hawker-game-user-points")
transactions_table = dynamodb.Table("hawker-game-points-transactions")
rewards_table = dynamodb.Table("hawker-game-rewards")
user_rewards_table = dynamodb.Table("hawker-game-user-rewards")

S3_BUCKET = "hawker-game-assets-sarjune-2025"

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)

def respond(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        "body": json.dumps(body, cls=DecimalEncoder),
    }

def get_user_info(event):
    """Extract user information from JWT token"""
    try:
        authorizer = event.get("requestContext", {}).get("authorizer", {})
        claims = authorizer.get("jwt", {}).get("claims", {})
        
        if not claims:
            claims = authorizer.get("claims", {})
        
        print(f"📋 Claims found: {json.dumps(claims)}")
        
        username = (
            claims.get("cognito:username") or 
            claims.get("username") or 
            claims.get("sub")
        )
        
        groups = []
        groups_claim = claims.get("cognito:groups", "")
        
        print(f"🔍 Raw groups_claim: {groups_claim} (type: {type(groups_claim)})")
        
        if groups_claim:
            if isinstance(groups_claim, list):
                for item in groups_claim:
                    item_str = str(item).strip()
                    print(f"🔍 Processing list item: '{item_str}'")
                    if item_str.startswith('[') and item_str.endswith(']'):
                        item_str = item_str[1:-1]
                        parsed_groups = [g.strip().strip('"').strip("'") for g in item_str.split(',')]
                        print(f"🔍 Parsed from brackets: {parsed_groups}")
                        groups.extend(parsed_groups)
                    else:
                        groups.append(item_str)
            elif isinstance(groups_claim, str):
                groups_str = groups_claim.strip()
                print(f"🔍 Processing string: '{groups_str}'")
                if groups_str.startswith('[') and groups_str.endswith(']'):
                    groups_str = groups_str[1:-1]
                    groups = [g.strip().strip('"').strip("'") for g in groups_str.split(',')]
                else:
                    groups = [groups_str] if groups_str else []
        
        print(f"✅ Extracted - User: {username}, Groups: {groups}, Type: {type(groups)}")
        return username, groups
        
    except Exception as e:
        print(f"❌ Error extracting user info: {str(e)}")
        traceback.print_exc()
        return None, []

def is_seller(groups):
    """Check if user is in sellers group"""
    if not groups:
        print(f"❌ No groups provided")
        return False
    
    for group in groups:
        group_str = str(group).strip().lower()
        print(f"🔍 Checking group: original='{group}', normalized='{group_str}'")
        if group_str == "sellers":
            print(f"✅ Seller group found!")
            return True
    
    print(f"❌ No seller group found. Checked: {groups}")
    return False

def generate_random_discount():
    discounts = [5, 10, 15, 20]
    discount = random.choice(discounts)
    return {
        "percentage": discount,
        "description": f"{discount}% off your next purchase at this hawker centre!"
    }

def generate_anonymous_name(user_id):
    """Generate a consistent anonymous name based on user_id hash"""
    # List of fun Singapore-themed prefixes and suffixes
    prefixes = [
        "Hawker", "Laksa", "Satay", "Chilli", "Char", "Roti", 
        "Kaya", "Bak", "Hokkien", "Nasi", "Chicken", "Prawn",
        "Merlion", "Durian", "Kopitiam", "Tau", "Kueh", "Popiah"
    ]
    
    suffixes = [
        "Master", "King", "Queen", "Lover", "Fan", "Expert",
        "Hero", "Chef", "Hunter", "Guru", "Ninja", "Legend",
        "Wizard", "Pro", "Boss", "Sensei", "Champion", "Star"
    ]
    
    # Create a hash of the user_id
    hash_obj = hashlib.md5(user_id.encode())
    hash_hex = hash_obj.hexdigest()
    
    # Use hash to consistently pick prefix and suffix
    prefix_idx = int(hash_hex[:8], 16) % len(prefixes)
    suffix_idx = int(hash_hex[8:16], 16) % len(suffixes)
    
    # Add a number for uniqueness
    number = int(hash_hex[16:20], 16) % 999 + 1
    
    return f"{prefixes[prefix_idx]}{suffixes[suffix_idx]}{number}"


# NEW: Points Helper Functions
def add_points(user_id, amount, source, description):
    """Award points to a user"""
    try:
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        # Get or create user points record
        response = user_points_table.get_item(Key={'user_id': user_id})
        
        if 'Item' in response:
            current_points = int(response['Item'].get('total_points', 0))
            lifetime_points = int(response['Item'].get('lifetime_points', 0))
            
            new_total = current_points + amount
            new_lifetime = lifetime_points + amount
            
            user_points_table.update_item(
                Key={'user_id': user_id},
                UpdateExpression='SET total_points = :total, lifetime_points = :lifetime, updated_at = :updated',
                ExpressionAttributeValues={
                    ':total': new_total,
                    ':lifetime': new_lifetime,
                    ':updated': timestamp
                }
            )
        else:
            new_total = amount
            user_points_table.put_item(
                Item={
                    'user_id': user_id,
                    'total_points': amount,
                    'lifetime_points': amount,
                    'points_spent': 0,
                    'created_at': timestamp,
                    'updated_at': timestamp
                }
            )
        
        # Create transaction record
        transaction_id = str(uuid.uuid4())
        transactions_table.put_item(
            Item={
                'transaction_id': transaction_id,
                'user_id': user_id,
                'amount': amount,
                'type': 'earn',
                'source': source,
                'description': description,
                'timestamp': timestamp,
                'metadata': {}
            }
        )
        
        print(f"✅ Awarded {amount} points to {user_id}. New balance: {new_total}")
        return new_total
        
    except Exception as e:
        print(f"❌ Error adding points: {str(e)}")
        traceback.print_exc()
        return None

def lambda_handler(event, context):
    print("EVENT:", json.dumps(event))
    route_key = event.get("routeKey", "")

    # Existing routes
    if route_key == "GET /centres":
        return get_centres()
    elif route_key == "GET /challenges/current":
        return get_random_challenge()
    elif route_key == "GET /challenges/all":
        return get_all_challenges()
    elif route_key == "POST /guess":
        return handle_guess(event)
    elif route_key == "POST /seller/upload-url":
        return create_presigned_upload_url(event)
    elif route_key == "POST /seller/challenge":
        return create_seller_challenge(event)
    
    # NEW: Get seller's past challenges
    elif route_key == "GET /seller/challenges":
        return get_seller_challenges(event)
    
    elif route_key == "GET /leaderboard":
        return handle_get_leaderboard(event)
    
    # Points & Rewards routes
    elif route_key == "POST /points/earn":
        return handle_add_points(event)
    elif route_key == "POST /points/spend":
        return handle_spend_points(event)
    elif route_key == "GET /points/balance":
        return handle_get_balance(event)
    elif route_key == "GET /points/transactions":
        return handle_get_transactions(event)
    elif route_key == "GET /rewards":
        return handle_get_rewards(event)
    elif route_key == "POST /rewards/claim":
        return handle_claim_reward(event)
    elif route_key == "GET /rewards/my-rewards":
        return handle_get_my_rewards(event)
    
    else:
        return respond(404, {"message": f"Invalid route: {route_key}"})

def get_centres():
    try:
        response = centres_table.scan()
        return respond(200, {"centres": response.get("Items", [])})
    except Exception as e:
        return respond(500, {"message": str(e)})

def get_random_challenge():
    try:
        response = challenges_table.scan(FilterExpression=Attr("status").eq("active"))
        items = response.get("Items", [])
        if not items:
            return respond(404, {"message": "No active challenges available."})
        
        challenge = random.choice(items)
        return respond(200, challenge)
    except Exception as e:
        print("Error in get_random_challenge:", str(e))
        return respond(500, {"message": str(e)})

def get_all_challenges():
    """
    Get all active challenges for public display (featured challenges)
    GET /challenges/all
    This is a public endpoint - no authentication required
    """
    try:
        # Scan for all active challenges
        response = challenges_table.scan(
            FilterExpression=Attr('status').eq('active')
        )
        
        challenges = response.get('Items', [])
        
        # Convert Decimal to int/float for JSON serialization
        challenges = json.loads(json.dumps(challenges, cls=DecimalEncoder))
        
        # Sort by ID (newest first)
        challenges.sort(key=lambda x: x.get('id', ''), reverse=True)
        
        print(f"✅ Retrieved {len(challenges)} active challenges for public display")
        
        return respond(200, {
            "challenges": challenges,
            "count": len(challenges)
        })
        
    except Exception as e:
        print("❌ Error in get_all_challenges:", traceback.format_exc())
        return respond(500, {"message": f"Error fetching challenges: {str(e)}"})

def handle_guess(event):
    try:
        username, _ = get_user_info(event)
        
        if not username:
            return respond(401, {"message": "User not authenticated"})
        
        body = json.loads(event.get("body", "{}"))
        challenge_id = body.get("challenge_id")
        centre_name = body.get("centre_name")

        if not challenge_id or not centre_name:
            return respond(400, {"message": "Missing required fields."})

        challenge_response = challenges_table.get_item(Key={"id": challenge_id})
        if "Item" not in challenge_response:
            return respond(404, {"message": "Challenge not found."})
        
        challenge = challenge_response["Item"]
        correct_centre_id = int(challenge.get("answer_hawker_centre_id", 0))

        centres_response = centres_table.scan()
        centres = {c["name"].lower(): c["id"] for c in centres_response.get("Items", [])}
        
        guessed_centre_id = centres.get(centre_name.lower())

        if guessed_centre_id is None:
            return respond(400, {"message": "Invalid centre name."})

        is_correct = (guessed_centre_id == correct_centre_id)
        
        result = {
            "correct": is_correct,
            "message": "Congratulations! You got it right!" if is_correct else "Oops! That's not correct.",
            "answer": next((c["name"] for c in centres_response["Items"] if c["id"] == correct_centre_id), "Unknown"),
        }

        if is_correct:
            # Award 200 points for correct guess
            points_earned = 200
            new_balance = add_points(
                user_id=username,
                amount=points_earned,
                source='challenge',
                description=f'Correct answer for challenge {challenge_id}'
            )
            
            if new_balance is not None:
                result["points_earned"] = points_earned
                result["new_balance"] = new_balance
            
            discount_info = generate_random_discount()
            result["reward"] = discount_info["description"]
            result["discount_percentage"] = discount_info["percentage"]

        return respond(200, result)
    except Exception as e:
        print("Error in handle_guess:", str(e))
        traceback.print_exc()
        return respond(500, {"message": str(e)})

# Points & Rewards Handlers
def handle_add_points(event):
    """Award points to a user"""
    try:
        username, _ = get_user_info(event)
        
        if not username:
            return respond(401, {"message": "User not authenticated"})
        
        body = json.loads(event.get("body", "{}"))
        amount = body.get('amount')
        source = body.get('source')
        description = body.get('description', '')
        
        if not amount or amount <= 0:
            return respond(400, {"message": "Invalid amount"})
        if not source:
            return respond(400, {"message": "Source is required"})
        
        new_balance = add_points(username, amount, source, description)
        
        if new_balance is None:
            return respond(500, {"message": "Failed to add points"})
        
        return respond(200, {
            "message": f"Successfully awarded {amount} points",
            "new_balance": new_balance,
            "amount_earned": amount
        })
    except Exception as e:
        print(f"❌ Error in handle_add_points: {str(e)}")
        traceback.print_exc()
        return respond(500, {"message": str(e)})

def handle_spend_points(event):
    """
    Deduct points from a user
    POST /points/spend
    Body: { amount: number, source: string, description: string }
    """
    try:
        username, _ = get_user_info(event)
        
        if not username:
            return respond(401, {"message": "User not authenticated"})
        
        body = json.loads(event.get("body", "{}"))
        amount = body.get('amount')
        source = body.get('source', 'manual')
        description = body.get('description', 'Points spent')
        
        # Validate amount
        if not amount or amount <= 0:
            return respond(400, {"message": "Amount must be positive"})
        
        amount = int(amount)
        
        # Check if user has enough points
        user_response = user_points_table.get_item(Key={'user_id': username})
        if 'Item' not in user_response:
            return respond(400, {
                'error': 'Insufficient coins',
                'required': amount,
                'current': 0
            })
        
        user_points = user_response['Item']
        current_balance = int(user_points.get('total_points', 0))
        
        if current_balance < amount:
            return respond(400, {
                'error': 'Insufficient coins',
                'required': amount,
                'current': current_balance,
                'shortfall': amount - current_balance
            })
        
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        # Deduct points
        new_balance = current_balance - amount
        points_spent = int(user_points.get('points_spent', 0)) + amount
        
        user_points_table.update_item(
            Key={'user_id': username},
            UpdateExpression='SET total_points = :total, points_spent = :spent, updated_at = :updated',
            ExpressionAttributeValues={
                ':total': new_balance,
                ':spent': points_spent,
                ':updated': timestamp
            }
        )
        
        # Create transaction record
        transaction_id = str(uuid.uuid4())
        transactions_table.put_item(
            Item={
                'transaction_id': transaction_id,
                'user_id': username,
                'amount': -amount,  # Negative for spend transaction
                'type': 'spend',
                'source': source,
                'description': description,
                'timestamp': timestamp,
                'metadata': {}
            }
        )
        
        print(f"✅ Deducted {amount} points from {username}. New balance: {new_balance}")
        
        return respond(200, {
            "message": f"Successfully spent {amount} points",
            "new_balance": new_balance,
            "amount_spent": amount
        })
        
    except Exception as e:
        print(f"❌ Error in handle_spend_points: {str(e)}")
        traceback.print_exc()
        return respond(500, {"message": str(e)})

def handle_get_balance(event):
    """Get user's current points balance"""
    try:
        username, _ = get_user_info(event)
        
        if not username:
            return respond(401, {"message": "User not authenticated"})
        
        response = user_points_table.get_item(Key={'user_id': username})
        
        if 'Item' not in response:
            return respond(200, {"total_points": 0})
        
        return respond(200, {
            "total_points": int(response['Item'].get('total_points', 0)),
            "lifetime_points": int(response['Item'].get('lifetime_points', 0)),
            "points_spent": int(response['Item'].get('points_spent', 0))
        })
    except Exception as e:
        print(f"❌ Error in handle_get_balance: {str(e)}")
        traceback.print_exc()
        return respond(500, {"message": str(e)})

def handle_get_transactions(event):
    """Get user's transaction history"""
    try:
        username, _ = get_user_info(event)
        
        if not username:
            return respond(401, {"message": "User not authenticated"})
        
        query_params = event.get('queryStringParameters', {}) or {}
        limit = int(query_params.get('limit', 20))
        
        response = transactions_table.query(
            IndexName='user-transactions-index',
            KeyConditionExpression=Key('user_id').eq(username),
            ScanIndexForward=False,
            Limit=limit
        )
        
        transactions = []
        for item in response.get('Items', []):
            transactions.append({
                'transaction_id': item.get('transaction_id'),
                'amount': int(item.get('amount', 0)),
                'type': item.get('type'),
                'source': item.get('source'),
                'description': item.get('description'),
                'timestamp': item.get('timestamp')
            })
        
        return respond(200, {
            'user_id': username,
            'transactions': transactions,
            'count': len(transactions)
        })
    except Exception as e:
        print(f"❌ Error in handle_get_transactions: {str(e)}")
        traceback.print_exc()
        return respond(500, {"message": str(e)})

def handle_get_rewards(event):
    """Get all available rewards"""
    try:
        response = rewards_table.scan(
            FilterExpression=Attr('active').eq(True)
        )
        
        rewards = []
        for item in response.get('Items', []):
            rewards.append({
                'reward_id': item.get('reward_id'),
                'id': item.get('reward_id'),
                'title': item.get('title'),
                'description': item.get('description'),
                'discount_percentage': int(item.get('discount_percentage', 0)),
                'points_cost': int(item.get('points_cost', 0)),
                'centre_name': item.get('centre_name', 'Any participating centre'),
                'active': item.get('active', True)
            })
        
        rewards.sort(key=lambda x: x['points_cost'])
        
        return respond(200, {'rewards': rewards, 'count': len(rewards)})
    except Exception as e:
        print(f"❌ Error in handle_get_rewards: {str(e)}")
        traceback.print_exc()
        return respond(500, {"message": str(e)})

def handle_claim_reward(event):
    """Claim a reward using points"""
    try:
        username, _ = get_user_info(event)
        
        if not username:
            return respond(401, {"message": "User not authenticated"})
        
        body = json.loads(event.get("body", "{}"))
        reward_id = body.get("reward_id")
        
        if not reward_id:
            return respond(400, {"message": "reward_id is required"})
        
        reward_response = rewards_table.get_item(Key={'reward_id': reward_id})
        if 'Item' not in reward_response:
            return respond(404, {"message": "Reward not found"})
        
        reward = reward_response['Item']
        
        if not reward.get('active', False):
            return respond(400, {"message": "This reward is no longer available"})
        
        points_cost = int(reward['points_cost'])
        
        # Get user's balance
        user_response = user_points_table.get_item(Key={'user_id': username})
        if 'Item' not in user_response:
            return respond(400, {
                'error': 'Insufficient points',
                'required': points_cost,
                'current': 0
            })
        
        user_points = user_response['Item']
        current_balance = int(user_points.get('total_points', 0))
        
        if current_balance < points_cost:
            return respond(400, {
                'error': 'Insufficient points',
                'required': points_cost,
                'current': current_balance,
                'shortfall': points_cost - current_balance
            })
        
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        # Deduct points
        new_balance = current_balance - points_cost
        points_spent = int(user_points.get('points_spent', 0)) + points_cost
        
        user_points_table.update_item(
            Key={'user_id': username},
            UpdateExpression='SET total_points = :total, points_spent = :spent, updated_at = :updated',
            ExpressionAttributeValues={
                ':total': new_balance,
                ':spent': points_spent,
                ':updated': timestamp
            }
        )
        
        # Create transaction
        transaction_id = str(uuid.uuid4())
        transactions_table.put_item(
            Item={
                'transaction_id': transaction_id,
                'user_id': username,
                'amount': -points_cost,
                'type': 'spend',
                'source': 'reward_claim',
                'description': f'Claimed {reward["title"]}',
                'timestamp': timestamp,
                'metadata': {
                    'reward_id': reward_id,
                    'reward_title': reward['title']
                }
            }
        )
        
        # Create user reward
        claim_id = str(uuid.uuid4())
        from datetime import timedelta
        expiry_date = (datetime.utcnow() + timedelta(days=30)).isoformat() + 'Z'
        
        user_rewards_table.put_item(
            Item={
                'claim_id': claim_id,
                'user_id': username,
                'reward_id': reward_id,
                'title': reward['title'],  # ✅ Add title
                'description': reward['description'],  # ✅ Add description
                'centre_name': reward.get('centre_name', 'Any participating centre'),  # ✅ Add centre_name
                'discount_percentage': int(reward['discount_percentage']),
                'points_cost': points_cost,  # ✅ Add points_cost
                'claimed_at': timestamp,
                'expiry_date': expiry_date,  # ✅ Add expiry_date
                'status': 'active'
            }
        )
        
        return respond(200, {
            'message': 'Reward claimed successfully!',
            'claim_id': claim_id,
            'reward': {
                'reward_id': reward_id,
                'title': reward['title'],
                'discount_percentage': int(reward['discount_percentage']),
                'description': reward['description']
            },
            'points_spent': points_cost,
            'new_balance': new_balance
        })
    except Exception as e:
        print(f"❌ Error in handle_claim_reward: {str(e)}")
        traceback.print_exc()
        return respond(500, {"message": str(e)})

def handle_get_my_rewards(event):
    """Get user's claimed rewards"""
    try:
        username, _ = get_user_info(event)
        
        if not username:
            return respond(401, {"message": "User not authenticated"})
        
        response = user_rewards_table.query(
            IndexName='user-rewards-index',
            KeyConditionExpression=Key('user_id').eq(username),
            ScanIndexForward=False
        )
        
        rewards = []
        for item in response.get('Items', []):
            rewards.append({
                'claim_id': item.get('claim_id'),
                'reward_id': item.get('reward_id'),
                'reward_title': item.get('reward_title'),
                'discount_percentage': int(item.get('discount_percentage', 0)),
                'points_spent': int(item.get('points_spent', 0)),
                'claimed_at': item.get('claimed_at'),
                'status': item.get('status', 'active')
            })
        
        return respond(200, {
            'user_id': username,
            'rewards': rewards,
            'count': len(rewards)
        })
    except Exception as e:
        print(f"❌ Error in handle_get_my_rewards: {str(e)}")
        traceback.print_exc()
        return respond(500, {"message": str(e)})

# Seller functions
def create_presigned_upload_url(event):
    try:
        username, groups = get_user_info(event)
        
        if not username:
            return respond(401, {"message": "Could not identify user"})
        
        print(f"🔐 Checking seller status for user: {username}")
        print(f"🔐 User groups: {groups} (type: {type(groups)})")
        
        if not is_seller(groups):
            print(f"❌ Access denied for user {username}")
            return respond(403, {"message": "Access denied. Only sellers can upload challenges."})
        
        print(f"✅ Seller access granted for: {username}")
        
        body = json.loads(event.get("body", "{}"))
        file_name = body.get("file_name")

        if not file_name:
            return respond(400, {"message": "Missing file_name in request body"})

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        file_extension = file_name.split(".")[-1] if "." in file_name else "jpg"
        new_file_name = f"{username}-{timestamp}.{file_extension}"
        key = f"challenges/{new_file_name}"

        presigned_url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": key,
                "ContentType": "image/jpeg",
            },
            ExpiresIn=300,
        )
        public_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{key}"

        return respond(200, {
            "upload_url": presigned_url,
            "public_url": public_url,
            "challenge_id": f"{username}-{timestamp}"
        })
    except Exception as e:
        print("❌ Error in create_presigned_upload_url:", traceback.format_exc())
        return respond(500, {"message": f"Failed to create presigned URL: {str(e)}"})
    
def handle_get_leaderboard(event):
    """
    Get leaderboard with top 10 users + current user's position
    GET /leaderboard
    """
    try:
        username, _ = get_user_info(event)
        
        if not username:
            return respond(401, {"message": "User not authenticated"})
        
        # Scan all users and get their points, sorted by total_points
        response = user_points_table.scan()
        all_users = response.get('Items', [])
        
        # Sort by total_points descending
        all_users.sort(key=lambda x: int(x.get('total_points', 0)), reverse=True)
        
        # Find current user's position
        current_user_rank = None
        current_user_points = 0
        
        for idx, user in enumerate(all_users):
            if user['user_id'] == username:
                current_user_rank = idx + 1
                current_user_points = int(user.get('total_points', 0))
                break
        
        # Get top 10
        top_10 = []
        for idx, user in enumerate(all_users[:10]):
            user_id = user['user_id']
            points = int(user.get('total_points', 0))
            
            # Check if this is the current user
            is_current_user = (user_id == username)
            
            entry = {
                'rank': idx + 1,
                'username': 'YOU' if is_current_user else generate_anonymous_name(user_id),
                'points': points,
                'is_current_user': is_current_user
            }
            top_10.append(entry)
        
        # Prepare response
        leaderboard_data = {
            'top_10': top_10,
            'current_user': {
                'rank': current_user_rank,
                'points': current_user_points,
                'total_players': len(all_users)
            }
        }
        
        # If user is not in top 10, add their position
        if current_user_rank and current_user_rank > 10:
            leaderboard_data['current_user']['show_separately'] = True
        else:
            leaderboard_data['current_user']['show_separately'] = False
        
        return respond(200, leaderboard_data)
        
    except Exception as e:
        print(f"❌ Error in handle_get_leaderboard: {str(e)}")
        traceback.print_exc()
        return respond(500, {"message": str(e)})


def create_seller_challenge(event):
    try:
        username, groups = get_user_info(event)
        
        if not username:
            return respond(401, {"message": "Could not identify user"})
        
        print(f"🔐 Checking seller status for user: {username}")
        
        if not is_seller(groups):
            print(f"❌ Access denied for user {username}")
            return respond(403, {"message": "Access denied. Only sellers can create challenges."})
        
        print(f"✅ Seller access granted for: {username}")
        
        body = json.loads(event.get("body", "{}"))
        image_url = body.get("image_url")
        centre_id = body.get("answer_hawker_centre_id")
        challenge_id = body.get("challenge_id")
        shop_description = body.get('shop_description', '')

        if not image_url or not centre_id:
            return respond(400, {"message": "Missing required fields."})

        if not challenge_id:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            challenge_id = f"{username}-{timestamp}"

        centre_id_decimal = Decimal(str(centre_id))

        new_challenge = {
            "id": challenge_id,
            "answer_hawker_centre_id": centre_id_decimal,
            'shop_description': shop_description,
            "image_url": image_url,
            "status": "active",
            "created_by": username,
        }

        challenges_table.put_item(Item=new_challenge)
        print(f"✅ Challenge created by seller {username}: {challenge_id}")
        return respond(201, {"message": f"Challenge created: {challenge_id}"})
    except Exception as e:
        print("❌ Error in create_seller_challenge:", traceback.format_exc())
        return respond(500, {"message": f"Error creating challenge: {str(e)}"})

def get_seller_challenges(event):
    """
    Get all challenges created by the authenticated seller
    GET /seller/challenges
    """
    try:
        username, groups = get_user_info(event)
        
        if not username:
            return respond(401, {"message": "Could not identify user"})
        
        print(f"🔐 Fetching challenges for seller: {username}")
        
        if not is_seller(groups):
            print(f"❌ Access denied for user {username}")
            return respond(403, {"message": "Access denied. Only sellers can view their challenges."})
        
        print(f"✅ Seller access granted for: {username}")
        
        # Scan the table and filter by created_by
        response = challenges_table.scan(
            FilterExpression=Attr('created_by').eq(username)
        )
        
        challenges = response.get('Items', [])
        
        # Convert Decimal to int/float for JSON serialization
        challenges = json.loads(json.dumps(challenges, cls=DecimalEncoder))
        
        # Sort by ID (which contains timestamp) - newest first
        challenges.sort(key=lambda x: x.get('id', ''), reverse=True)
        
        print(f"✅ Found {len(challenges)} challenges for seller {username}")
        
        return respond(200, {
            "challenges": challenges,
            "count": len(challenges)
        })
        
    except Exception as e:
        print("❌ Error in get_seller_challenges:", traceback.format_exc())
        return respond(500, {"message": f"Error fetching challenges: {str(e)}"})