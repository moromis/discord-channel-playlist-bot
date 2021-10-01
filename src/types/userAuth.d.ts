export interface UserAuthType {
  accessToken: string;
  refreshToken: string;
  expirationDate: string;
}

export namespace UserAuth {
  export interface Collection {
    [userId: string]: UserAuthType;
  }
}
