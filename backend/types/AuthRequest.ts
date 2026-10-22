import { Request } from "express";
export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  phoneCode: string;
  pic: string | null;
  banner: string | null;
  bio: string;
  lastSeen: Date;
  followers: string[];
  following: string[];
};
export interface AuthRequest<
  P = any,
  ResB = any,
  ReqB = any,
  ReqQ = any,
> extends Request<P, ResB, ReqB, ReqQ> {
  user?: AuthUser;
  actk?: string;
}
