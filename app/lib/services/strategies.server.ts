import { OAuth2Strategy } from "remix-auth-oauth2";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE KEY is required");
}

if (!process.env.GOOGLE_CALLBACK_URL) {
  throw new Error("CALLBACK URL is required");
}

export const googleOauth2Strategy = new OAuth2Strategy(
  {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,

    // NOTE: Saturday, September 14, 2024, forgor what time but sure it's past 9PM.
    // both authorizationEndpoint and tokenEndpoint value is from CHATGPT
    // the documentation didn't really explain what to be put in both of that parameters
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    redirectURI: process.env.GOOGLE_CALLBACK_URL,

    scopes: ["openid", "email", "profile"],
  },
  async ({ tokens, profile }) => {
    console.log("LOG FROM AUTH GOOGLE STRATEGY");
    console.log({ tokens, profile });

    const userInfo: {
      sub: string;
      name: string;
      given_name: string;
      family_name: string;
      picture: string;
      email: string;
      email_verified: boolean;
    } = await fetch(
      // this fetch target is also from CHATGPT.
      // actually the tokens.scope is returned some value that looks like a url
      // but somehow it redirects to nowhere and get nothing,
      // here's some example value you get from tokens.scope
      // scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid'
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `${tokens.token_type} ${tokens.access_token}`,
        },
      }
    ).then((response) => response.json());

    console.log("User Info:");
    console.log(userInfo);

    // do whatever you want from here onwards, add new users to database, etc...

    // return the object that can be used by authenticator objects in `auth.server.ts`
    return {
      name: userInfo.name,
      email: userInfo.email,
      image: userInfo.picture,
    };
  }
);
