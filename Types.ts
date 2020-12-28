export let Tools: any;
export interface IUser {
  email: string;
  password: string;
  username: string;
  roles: string;
  isActive: boolean;
  activationToken: boolean;
  country: string;
  _id: string;
  mangoPayUserId: string;
  cagnotteId: string;
}

export interface UpdateQueryResult<P> {
  dataValues: P;
}

export interface RequestBody extends IUser {
  fromBo: boolean;
}

interface Payload {
  errors?: string[];
  message?: string;
  body?: any;
}

export interface Req {
  body: RequestBody;
}

export interface Res {
  status: (
    code: number
  ) => {
    json: (payload: Payload) => void;
  };
}
