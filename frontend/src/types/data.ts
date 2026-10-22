export interface Data<T> {
  data?: T;
  message: string;
  status?: boolean;
  issue?: boolean;
  actk?: string;
  errors?: Record<string, string>;
  moreInfo?: boolean;
}
