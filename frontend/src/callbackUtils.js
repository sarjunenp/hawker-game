import axios from "axios";

export async function exchangeCodeForToken(code) {
  const tokenEndpoint = `${process.env.REACT_APP_COGNITO_DOMAIN}/oauth2/token`;
  
  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("client_id", process.env.REACT_APP_CLIENT_ID);
  params.append("code", code);
  params.append("redirect_uri", process.env.REACT_APP_REDIRECT_URI);

  console.log("🔄 Exchanging code for token...");
  console.log("Token endpoint:", tokenEndpoint);
  console.log("Client ID:", process.env.REACT_APP_CLIENT_ID);
  console.log("Redirect URI:", process.env.REACT_APP_REDIRECT_URI);

  try {
    const response = await axios.post(tokenEndpoint, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log("✅ Token exchange successful!");
    return response.data;
  } catch (error) {
    console.error("❌ Token exchange failed:", error.response?.data || error.message);
    throw error;
  }
}