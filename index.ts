import { UserEntity } from "./Entity/User";
import { IUser, Req, Res } from "./Types";
import { bodyValidator, ControllerError } from "./utils/index";

declare var sails: any;
declare var jwToken: any;
declare var ResponseTransformer: any;
declare var Tools: any;

const create = async ({ body }: Req, res: Res) => {
  try {
    bodyValidator(body, ["email", "password"]);

    let token: string;
    let existingUser: IUser;

    const User = new UserEntity(body);

    const currentUser = await User.findCurrentUser();

    if (currentUser) {
      if (body.fromBo === true) {
        throw new ControllerError(400, ["user_already_exists"]);
      }

      existingUser = currentUser;
      User.setData(
        {
          roles: JSON.stringify(["USER"]),
          isActive: true,
        },
        true
      );

      if (!existingUser.country) {
        User.setData({
          country: "France",
        });
      }

      const updatedUser = await User.unifiedAndFindUser(existingUser);

      token = jwToken.generateFor(currentUser);
      res.status(200).json({
        body: {
          user: ResponseTransformer.user(updatedUser),
          token,
          update: true,
        },
      });
    }

    if (!User.data.roles) {
      User.setData({
        roles: JSON.stringify(["USER"]),
      });
    }

    const result = await User.persistUser();

    if (!result) {
      throw new ControllerError(400, ["password_encoding_error"]);
    }

    token = await User.createToken();

    const mongoPayId =
      sails.config.environment === "test" ? 111111 : User.getMangoPayId();

    await User.initUserAccount(mongoPayId);

    if (User.data._id) {
      User.sendUserCreateMail();
      res.status(200).json({
        body: {
          user: ResponseTransformer.user(User.data),
          token,
        },
      });
    } else {
      throw new ControllerError(503, ["user_not_saved"]);
    }
  } catch (err) {
    if (err.code) {
      res.status(err.code).json({
        errors: [...err.payload],
        message: err.payload[0],
      });
    }
    sails.tracer.warn(err && err.message ? err.message : err);
    Tools.errorCallback(err, res);
  }
};
