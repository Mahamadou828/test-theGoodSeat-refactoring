import { IUser } from "../Types";

declare var sails: any;
declare var MailService: any;
declare var PaymentService: any;

declare var sails;

export class UserServices {
  public data: IUser;
  constructor(user: IUser) {
    this.data = {
      ...user,
      email: user.email.toLowerCase(),
      username: user.username.toLocaleLowerCase(),
    };
  }
  getMangoPayId = () => {
    return PaymentService.getMangoPayUserId(this.data);
  };

  sendUserCreateMail = () => {
    MailService.sendUserCreated(this.data.email, {
      user: this.data,
    });
  };

  sendConfirmationEmail = async () => {
    if (
      this.data &&
      this.data._id &&
      sails.config.enyo.user.emailConfirmationRequired
    ) {
      return await MailService.sendEmailConfirmation(this.data);
    }
    return true;
  };
}
