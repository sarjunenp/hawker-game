import json
import random
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Attr, Key
from geopy.distance import geodesic

# --- DynamoDB Setup ---
dynamodb = boto3.resource("dynamodb")
centres_table = dynamodb.Table("hawker_centres")
challenges_table = dynamodb.Table("challenges")
rewards_table = dynamodb.Table("rewards")


# --- Helper: Decimal Serializer for DynamoDB ---
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)


# --- Helper: Standardized JSON response ---
def respond(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        "body": json.dumps(body, cls=DecimalEncoder),
    }


# --- Lambda Entry Point ---
def lambda_handler(event, context):
    print("EVENT:", json.dumps(event))
    route_key = event.get("routeKey", "")
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")

    if route_key == "GET /centres":
        return get_centres()

    elif route_key == "GET /challenges/current":
        return get_current_challenge()

    elif route_key == "POST /guess":
        return handle_guess(event)

    elif route_key == "GET /seller/rewards":
        return get_seller_rewards(event)

    elif route_key == "POST /seller/rewards":
        return create_seller_reward(event)

    elif route_key == "GET /seller/rewards/{id}":
        return get_reward_by_id(event)

    elif route_key == "PATCH /seller/rewards/{id}":
        return update_seller_reward(event)

    else:
        return respond(404, {"message": f"Invalid route: {route_key}"})


# ---------------------------------------------------------------------
# ROUTE: GET /centres
# ---------------------------------------------------------------------
def get_centres():
    try:
        response = centres_table.scan()
        return respond(200, {"centres": response.get("Items", [])})
    except Exception as e:
        return respond(500, {"message": f"Error fetching centres: {str(e)}"})


# ---------------------------------------------------------------------
# ROUTE: GET /challenges/current
# ---------------------------------------------------------------------
def get_current_challenge():
    try:
        response = challenges_table.scan(FilterExpression=Attr("status").eq("active"))
        items = response.get("Items", [])
        if not items:
            return respond(404, {"message": "No active challenge found."})
        return respond(200, items[0])
    except Exception as e:
        return respond(500, {"message": f"Error fetching challenge: {str(e)}"})


# ---------------------------------------------------------------------
# ROUTE: POST /guess
# ---------------------------------------------------------------------
def handle_guess(event):
    try:
        body = json.loads(event.get("body", "{}"))
        user_guess = (body.get("centre_name") or "").strip()
        user_lat = body.get("lat")
        user_lng = body.get("lng")

        # --- Get active challenge ---
        active_challenges = challenges_table.scan(
            FilterExpression=Attr("status").eq("active")
        ).get("Items", [])
        if not active_challenges:
            return respond(404, {"message": "No active challenge found."})

        challenge = active_challenges[0]
        answer_id = challenge.get("answer_hawker_centre_id")

        # --- Get correct hawker centre from DB ---
        answer_item = centres_table.get_item(Key={"id": int(answer_id)}).get("Item")
        if not answer_item:
            return respond(404, {"message": "Answer hawker centre not found."})

        answer_name = answer_item["name"]
        answer_lat = float(answer_item.get("lat"))
        # ✅ Fix: your DynamoDB uses "lon" instead of "lng"
        answer_lng = float(answer_item.get("lon") or answer_item.get("lng"))

        # --- If coordinates are provided ---
        if user_lat is not None and user_lng is not None:
            try:
                user_coords = (float(user_lat), float(user_lng))
                answer_coords = (answer_lat, answer_lng)
                distance = geodesic(user_coords, answer_coords).meters

                if distance <= 150:
                    return respond(200, {
                        "correct": True,
                        "message": f"Perfect! 🎯 You’re only {int(distance)}m away from {answer_name}.",
                        "distance": distance,
                        "reward": "Congratulations!"
                    })
                elif distance <= 500:
                    return respond(200, {
                        "correct": False,
                        "message": f"Close! You’re {int(distance)}m away from {answer_name}. Try again!",
                        "distance": distance
                    })
                else:
                    return respond(200, {
                        "correct": False,
                        "message": f"Not quite! You’re {int(distance)}m away. Zoom closer!",
                        "distance": distance
                    })
            except Exception as e:
                return respond(400, {"message": f"Invalid coordinates: {str(e)}"})

        # --- Otherwise fall back to text guessing ---
        elif user_guess:
            if user_guess.lower() == answer_name.lower():
                reward_id = challenge.get("reward_id")
                reward_item = rewards_table.get_item(Key={"id": reward_id}).get("Item", {})
                return respond(200, {
                    "correct": True,
                    "match_type": "name",
                    "message": "Correct! 🎉 You guessed the right hawker centre.",
                    "image_url": challenge.get("image_url"),
                    "reward": reward_item.get("description", "Congratulations!"),
                })
            else:
                return respond(200, {
                    "correct": False,
                    "message": "Oops! That’s not the right hawker centre. Try again!",
                })

        else:
            return respond(400, {"message": "No guess provided (need name or coordinates)."})

    except Exception as e:
        return respond(500, {"message": f"Error processing guess: {str(e)}"})


# ---------------------------------------------------------------------
# ROUTE: GET /seller/rewards
# ---------------------------------------------------------------------
def get_seller_rewards(event):
    try:
        claims = event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {})
        groups = claims.get("cognito:groups", [])
        username = claims.get("cognito:username", "unknown")

        if "sellers" not in groups:
            return respond(403, {"message": "Access denied. Seller role required."})

        response = rewards_table.scan()
        items = response.get("Items", [])
        seller_rewards = [r for r in items if r.get("created_by", username) == username]

        return respond(200, {"seller": username, "rewards": seller_rewards})
    except Exception as e:
        return respond(500, {"message": f"Error retrieving rewards: {str(e)}"})


# ---------------------------------------------------------------------
# ROUTE: POST /seller/rewards
# ---------------------------------------------------------------------
def create_seller_reward(event):
    try:
        claims = event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {})
        groups = claims.get("cognito:groups", [])
        username = claims.get("cognito:username", "unknown")

        if "sellers" not in groups:
            return respond(403, {"message": "Access denied. Seller role required."})

        body = json.loads(event.get("body", "{}"))
        reward_id = f"reward-{random.randint(1000, 9999)}"

        new_reward = {
            "id": reward_id,
            "description": body.get("description", "No description provided"),
            "discount_value": Decimal(str(body.get("discount_value", 10))),
            "discount_type": body.get("discount_type", "percent"),
            "status": "active",
            "created_by": username,
            "challenge_id": body.get("challenge_id", "none"),
        }

        rewards_table.put_item(Item=new_reward)
        return respond(201, {"message": "Reward created successfully.", "reward": new_reward})
    except Exception as e:
        return respond(500, {"message": f"Error creating reward: {str(e)}"})


# ---------------------------------------------------------------------
# ROUTE: GET /seller/rewards/{id}
# ---------------------------------------------------------------------
def get_reward_by_id(event):
    try:
        claims = event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {})
        groups = claims.get("cognito:groups", [])
        username = claims.get("cognito:username", "unknown")

        if "sellers" not in groups:
            return respond(403, {"message": "Access denied. Seller role required."})

        reward_id = event.get("pathParameters", {}).get("id")
        if not reward_id:
            return respond(400, {"message": "Missing reward ID in path."})

        reward = rewards_table.get_item(Key={"id": reward_id}).get("Item")
        if not reward:
            return respond(404, {"message": f"Reward {reward_id} not found."})

        if reward.get("created_by") != username:
            return respond(403, {"message": "You are not authorized to view this reward."})

        return respond(200, {"reward": reward})
    except Exception as e:
        return respond(500, {"message": f"Error retrieving reward: {str(e)}"})


# ---------------------------------------------------------------------
# ROUTE: PATCH /seller/rewards/{id}
# ---------------------------------------------------------------------
def update_seller_reward(event):
    try:
        claims = event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {})
        groups = claims.get("cognito:groups", [])
        username = claims.get("cognito:username", "unknown")

        if "sellers" not in groups:
            return respond(403, {"message": "Access denied. Seller role required."})

        reward_id = event.get("pathParameters", {}).get("id")
        if not reward_id:
            return respond(400, {"message": "Missing reward ID in path."})

        body = json.loads(event.get("body", "{}"))
        update_expr = []
        expr_attr_values = {}

        for field in ["description", "discount_value", "discount_type", "status"]:
            if field in body:
                update_expr.append(f"{field} = :{field}")
                expr_attr_values[f":{field}"] = (
                    Decimal(str(body[field])) if field == "discount_value" else body[field]
                )

        if not update_expr:
            return respond(400, {"message": "No valid fields to update."})

        rewards_table.update_item(
            Key={"id": reward_id},
            UpdateExpression="SET " + ", ".join(update_expr),
            ExpressionAttributeValues=expr_attr_values,
        )

        return respond(200, {"message": f"Reward {reward_id} updated successfully."})
    except Exception as e:
        return respond(500, {"message": f"Error updating reward: {str(e)}"})
