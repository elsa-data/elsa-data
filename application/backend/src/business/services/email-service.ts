import { inject, injectable } from "tsyringe";
import { ElsaSettings } from "../../config/elsa-settings";
import { createTransport, Transporter } from "nodemailer";
import * as aws from "@aws-sdk/client-ses";
import { Logger } from "pino";
import { AuditEventService } from "./audit-event-service";
import * as edgedb from "edgedb";
import { AwsEnabledService } from "./aws/aws-enabled-service";
import Email from "email-templates";
import { Address } from "nodemailer/lib/mailer";

@injectable()
export class EmailService {
  private transporter?: Transporter;

  constructor(
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("SESClient") private readonly ses: aws.SES,
    @inject("Logger") private readonly logger: Logger,
    @inject(AuditEventService)
    private readonly auditEventService: AuditEventService,
    @inject(AwsEnabledService)
    private readonly awsEnabledService: AwsEnabledService
  ) {}

  /**
   * Setup the mail service.
   */
  public async setup() {
    if (
      this.settings.emailer?.mode === "SES" &&
      (await this.awsEnabledService.isEnabled())
    ) {
      this.transporter = createTransport(
        {
          SES: { ses: this.ses, aws },
          maxConnections: this.settings.emailer.maxConnections,
          sendingRate: this.settings.emailer.sendingRate,
        },
        this.settings.emailer.defaults
      );
    } else if (this.settings.emailer?.mode === "SMTP") {
      this.transporter = createTransport(
        this.settings.emailer.options,
        this.settings.emailer.defaults
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

    if (this.settings.emailer?.templateDictionary !== undefined) {
      return Object.assign(
        localsReturned,
        this.settings.emailer.templateDictionary
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
  public async sendEmailTemplate(
    template: string,
    to: string,
    locals?: Record<string, string>
  ) {
    if (this.settings.emailer?.from === undefined) {
      return;
    }

    return await this.sendEmail(
      async (transport, from, to) => {
        const email = new Email({
          message: {
            from,
          },
          send: this.settings.devTesting?.sendEmails,
          transport: transport,
        });

        this.logger.debug(`Sent email: ${email}`);

        return await email.send({
          template: template,
          message: {
            to,
          },
          locals: this.mergeLocals(locals),
        });
      },
      this.settings.emailer.from,
      to
    );
  }

  /**
   * Send an email with an audit event and retry functionality.
   */
  public async sendEmail(
    sendFn: (
      transporter: Transporter,
      from: Address,
      to: string
    ) => Promise<any>,
    from: Address,
    to: string
  ): Promise<any> {
    return await this.auditEventService.systemAuditEventPattern(
      "Email sent",
      async (completeAuditFn) => {
        // Not sure that there's much point trying to send an email more than once, but I could be wrong.
        const tryCount = 1;

        let [result, tried] = await this.retry(
          async () => {
            if (this.transporter === undefined) {
              return undefined;
            }

            return await sendFn(this.transporter, from, to);
          },
          tryCount,
          "sending mail"
        );

        await completeAuditFn(
          {
            from,
            to,
            tryCount: tried,
          },
          this.edgeDbClient
        );

        return result;
      },
      {
        from,
        to,
      },
      false,
      4
    );
  }
}
