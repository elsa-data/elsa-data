import { inject, injectable } from "tsyringe";
import { ElsaSettings } from "../../config/elsa-settings";
import { createTransport, Transporter } from "nodemailer";
import * as aws from "@aws-sdk/client-ses";
import Mail from "nodemailer/lib/mailer";
import { Logger } from "pino";
import { AuditEventService } from "./audit-event-service";
import * as edgedb from "edgedb";
import { AwsEnabledService } from "./aws/aws-enabled-service";
import Email from "email-templates";

@injectable()
export class MailService {
  private transporter?: Transporter;

  constructor(
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("SESClient") private readonly ses: aws.SES,
    @inject("Logger") private readonly logger: Logger,
    @inject(AuditEventService)
    private readonly auditLogService: AuditEventService,
    @inject(AwsEnabledService)
    private readonly awsEnabledService: AwsEnabledService
  ) {}

  /**
   * Setup the mail service.
   */
  public async setup() {
    if (
      this.settings.mailer?.mode === "SES" &&
      (await this.awsEnabledService.isEnabled())
    ) {
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
        this.logger.error(error, "Failed to setup mail server");
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
   * Merge locals with the template dictionary from settings. Overwrites the defaults
   * locals with the template dictionary values.
   * @param locals
   */
  public mergeLocals(locals?: Record<string, string>): Record<string, string> {
    const localsReturned = locals !== undefined ? locals : {};

    if (this.settings.mailer?.templateDictionary !== undefined) {
      return Object.assign(
        localsReturned,
        this.settings.mailer.templateDictionary
      );
    } else {
      return localsReturned;
    }
  }

  /**
   * Send an email using a template.
   * @param template
   * @param locals
   * @param to
   */
  public async sendMailTemplate(
    template: string,
    to: string,
    locals?: Record<string, string>
  ) {
    if (this.settings.mailer?.from === undefined) {
      return;
    }

    return await this.sendMail(
      async (transport, from, to) => {
        const email = new Email({
          message: {
            from,
          },
          transport: transport,
        });

        return await email.send({
          template: template,
          message: {
            to,
          },
          locals: this.mergeLocals(locals),
        });
      },
      this.settings.mailer.from,
      to
    );
  }

  /**
   * Send an email with an audit event and retry functionality.
   */
  public async sendMail(
    sendFn: (
      transporter: Transporter,
      from: string,
      to: string
    ) => Promise<any>,
    from: string,
    to: string
  ): Promise<any> {
    const tryCount = 3;
    let [result, tried] = [undefined, 0];
    try {
      [result, tried] = await this.retry(
        async () => {
          if (this.transporter === undefined) {
            return undefined;
          }

          return await sendFn(this.transporter, from, to);
        },
        tryCount,
        "sending mail"
      );
    } catch (err) {
      await this.auditLogService.createSystemAuditEvent(
        "E",
        "Email sent",
        {
          from,
          to,
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
        from,
        to,
        tryCount: tried,
      },
      0,
      this.edgeDbClient
    );

    return result;
  }
}
