import { inject, injectable } from "tsyringe";
import { ElsaSettings } from "../../config/elsa-settings";
import { createTransport, Transporter } from "nodemailer";
import * as aws from "@aws-sdk/client-ses";
import Mail from "nodemailer/lib/mailer";
import { Logger } from "pino";
import { AuditEventService } from "./audit-event-service";
import * as edgedb from "edgedb";
import { MailTransporterUndefined } from "../exceptions/mail";

@injectable()
export class MailService {
  private transporter?: Transporter;

  constructor(
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("SESClient") private readonly ses: aws.SES,
    @inject("Logger") private readonly logger: Logger,
    @inject(AuditEventService)
    private readonly auditLogService: AuditEventService
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
        this.logger.error(error, `Failed to setup mail server`);
      } else {
        this.logger.info("Mail server ready");
      }
    });
  }

  /**
   * Retry mechanism for sending an email. Returns the result and the number of times tried.
   * @param fn send mail promise
   * @param tryCount number of times to retry
   * @param errMsg error message
   */
  public async retry(
    fn: () => Promise<any>,
    tryCount: number,
    errMsg: string
  ): Promise<[any, number]> {
    let err = undefined;

    for (let i = 1; i <= tryCount; i++) {
      try {
        return [await fn(), i];
      } catch (e) {
        err = e;
        this.logger.info(`${errMsg} failed with: ${err}, retried ${i} times.`);
      }
    }

    throw err;
  }

  /**
   * Send email.
   */
  public async sendMail(mail: Mail.Options): Promise<any> {
    if (this.transporter === undefined) {
      throw new MailTransporterUndefined();
    }

    const tryCount = 3;
    let [result, tried] = [undefined, 0];
    try {
      [result, tried] = await this.retry(
        async () => {
          return await this.transporter?.sendMail(mail);
        },
        tryCount,
        "sending mail"
      );
    } catch (err) {
      await this.auditLogService.createSystemAuditEvent(
        "E",
        "Email sent",
        {
          from: mail.from,
          to: mail.to,
          tryCount,
        },
        8,
        this.edgeDbClient
      );
    }

    await this.auditLogService.createSystemAuditEvent(
      "E",
      "Email sent",
      {
        from: mail.from,
        to: mail.to,
        tryCount: tried,
      },
      0,
      this.edgeDbClient
    );

    return result;
  }
}
