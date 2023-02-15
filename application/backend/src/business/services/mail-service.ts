import { inject, injectable } from "tsyringe";
import { ElsaSettings } from "../../config/elsa-settings";
import { createTransport, Transporter } from "nodemailer";
import * as aws from "@aws-sdk/client-ses";
import Mail from "nodemailer/lib/mailer";
import { AuditLogService } from "./audit-log-service";
import * as edgedb from "edgedb";

@injectable()
export class MailService {
  private transporter?: Transporter;

  constructor(
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("SESClient") private readonly ses: aws.SES,
    private readonly auditLogService: AuditLogService
  ) {}

  /**
   * Setup the mail service.
   */
  public setup() {
    if (this.settings.mailer?.mode === "SES") {
      this.transporter = createTransport(
        {
          SES: { ses: this.ses, aws },
          maxConnections: this.settings.mailer.maxConnections,
          sendingRate: this.settings.mailer.sendingRate,
        },
        this.settings.mailer.defaults
      );
    } else if (this.settings.mailer?.mode === "SMTP") {
      this.transporter = createTransport(
        this.settings.mailer.options,
        this.settings.mailer.defaults
      );
    }

    this.transporter?.verify((error, _) => {
      if (error) {
        console.log(`Failed to setup mail server:\n  ${error}`);
      } else {
        console.log("Mail server ready");
      }
    });
  }

  /**
   * Send email.
   */
  public async sendMail(mail: Mail.Options): Promise<any> {
    await this.auditLogService.createSystemAuditEvent(
      this.edgeDbClient,
      "E",
      "Email sent",
      { email: mail }
    );
    return await this.transporter?.sendMail(mail);
  }
}
