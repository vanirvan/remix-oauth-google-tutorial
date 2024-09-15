import { Authenticator } from "remix-auth";
import { sessionStorage } from "./session.server";
import { googleOauth2Strategy } from "./strategies.server";

// you can also put a generic type right there, or whatever the name is
// it will make sure each time you call this authenticator, it will return the expected value
// but you also should return the same type of value like the type you passed right there.
// more info just read the README.md file
// my typescript knowledge is not that good, either my english skills
/*
export const authenticator = new Authenticator<User>(sessionStorage);
*/
export const authenticator = new Authenticator(sessionStorage);

// use the strategy
/* 
  authenticator.use(strategy function, strategy name)
*/
authenticator.use(googleOauth2Strategy, "google");
