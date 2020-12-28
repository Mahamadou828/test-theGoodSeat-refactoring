import { IUser, UpdateQueryResult } from "../Types";
import { UserServices } from "../Services/UserServices";

declare var sails: any;
declare var jwToken: any;
declare var AuthService: any;

interface IUserServices {
  data: IUser;
}

export class UserEntity extends UserServices implements IUserServices {
  public data: IUser;
  constructor(user: IUser) {
    super(user);
  }

  setData = (data: Partial<IUser>, activeToken: boolean = false) => {
    this.data = {
      ...this.data,
      ...data,
    };
    if (activeToken && this.data.activationToken) {
      delete this.data.activationToken;
    }
  };

  findCurrentUser = async () => {
    return (await sails.models.user.em.findOne({
      where: {
        email: this.data.email,
      },
    })) as IUser;
  };

  persistUser = async () => {
    const authData = AuthService.beforeCreate(this.data);
    if (authData) {
      return await sails.models.user.em.create(this.data, {
        raw: true,
      });
    }
    throw new Error("password_encoding_error");
  };

  createToken = async () => {
    if (this.data.roles && typeof this.data.roles === "string") {
      try {
        this.data.roles = JSON.parse(this.data.roles);
      } catch (e) {
        sails.tracer.warn(e);
      }
    }
    const token = jwToken.generateFor(this.data);
    if (this.data.activationToken) {
      delete this.data.activationToken;
    }
    await sails.models.user.em.update(this.data, {
      where: {
        _id: this.data._id,
      },
    });

    await this.sendConfirmationEmail();
    return token;
  };

  unifiedAndFindUser = async (unifiedUser: IUser) => {
    sails.models.user.em.unifiedUpdate(
      {
        _id: unifiedUser._id,
      },
      this.data
    );
    const currentUser = (await sails.models.user.em.findOne({
      where: {
        email: unifiedUser.email,
      },
    })) as IUser;

    return currentUser;
  };

  createCagnotte = async (result: UpdateQueryResult<IUser>) => {
    if (result && result.dataValues) {
      this.data.cagnotteId = result.dataValues._id;
      return await sails.models.user.em.update(
        {
          cagnotteId: result.dataValues._id,
        },
        {
          where: {
            _id: this.data._id,
          },
        }
      );
    }
    throw new Error("error_cagnotte_creation");
  };

  initUserAccount = async (mangoPayUserId: string) => {
    const updatedUser = await sails.models.user.em.update(
      {
        mangoPayUserId,
      },
      {
        where: {
          _id: this.data._id,
        },
      }
    );

    await sails.models.cagnotte.em.create(
      {
        amount: 0,
        userId: this.data._id,
      },
      {
        raw: true,
      }
    );

    return await this.createCagnotte(updatedUser);
  };
}
