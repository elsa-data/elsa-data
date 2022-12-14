import {inject, injectable} from "tsyringe";
import {ElsaSettings} from "../../config/elsa-settings";
import {createTransport, Transporter} from "nodemailer";
import * as aws from "@aws-sdk/client-ses";
import Mail from "nodemailer/lib/mailer";
let { defaultProvider } = require("@aws-sdk/credential-provider-node");

@injectable()
export class MailService {
  private transporter?: Transporter;

  constructor(
    @inject("Settings") private settings: ElsaSettings
  ) {}

  /**
   * Setup the mail service using settings.
   */
  public setup() {
    if (this.settings.mailer?.SES !== undefined) {
      const ses = new aws.SES({
        ...this.settings.mailer.SES,
        credentials: defaultProvider,
      });

      this.transporter = createTransport({ SES: { ses, aws } }, this.settings.mailer.defaults);
    } else if (this.settings.mailer?.options !== undefined) {
      this.transporter = createTransport(this.settings.mailer.options, this.settings.mailer.defaults);
    }

    this.transporter?.verify((error, _) => {
      if (error) {
        console.log(`Failed to setup mail server:\n ${error}`);
      } else {
        console.log("mail server ready");
      }
    });
  }

  /**
   * Send mail.
   */
  public async sendMail(mail: Mail.Options): Promise<any> {
    return await this.transporter?.sendMail(mail)
  }
}