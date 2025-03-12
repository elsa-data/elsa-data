"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var worker_threads_1 = require("worker_threads");
var job_service_1 = require("../src/business/services/jobs/job-service");
var bootstrap_dependency_injection_1 = require("../src/bootstrap-dependency-injection");
var node_worker_threads_1 = require("node:worker_threads");
var bootstrap_settings_1 = require("../src/bootstrap-settings");
var config_load_1 = require("../src/config/config-load");
var pino_1 = require("pino");
var job_cloud_formation_delete_service_1 = require("../src/business/services/jobs/job-cloud-formation-delete-service");
var job_cloud_formation_create_service_1 = require("../src/business/services/jobs/job-cloud-formation-create-service");
var job_copy_out_service_1 = require("../src/business/services/jobs/job-copy-out-service");
var date_fns_1 = require("date-fns");
var features_1 = require("../src/features");
function sleep(ms) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, ms);
  });
}
(function () {
  return __awaiter(void 0, void 0, void 0, function () {
    var rawConfig,
      settings,
      logger,
      dc,
      features,
      isJobHandlerCancelled,
      failureCount,
      secondsChunk,
      lastEmptyInProgressMessageDateTime,
      _loop_1;
    var _a;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          console.log("HEELO FROM THE WORKER!");
          return [
            4 /*yield*/,
            (0, config_load_1.getDirectConfig)(
              node_worker_threads_1.workerData.job.worker.workerData,
            ),
          ];
        case 1:
          rawConfig = _b.sent();
          return [
            4 /*yield*/,
            (0, bootstrap_settings_1.bootstrapSettings)(rawConfig),
          ];
        case 2:
          settings = _b.sent();
          logger = (0, pino_1.default)(settings.logger).child({
            context: "job-handler",
          });
          return [
            4 /*yield*/,
            (0, bootstrap_dependency_injection_1.bootstrapDependencyInjection)(
              logger,
              (_a = settings.devTesting) === null || _a === void 0
                ? void 0
                : _a.mockAwsCloud,
            ),
          ];
        case 3:
          dc = _b.sent();
          dc.register("Settings", {
            useValue: settings,
          });
          dc.register("Logger", {
            useValue: logger,
          });
          return [
            4 /*yield*/,
            (0, features_1.getFeaturesEnabled)(dc, settings),
          ];
        case 4:
          features = _b.sent();
          dc.register("Features", {
            useValue: features,
          });
          isJobHandlerCancelled = false;
          failureCount = 0;
          // handle cancellation
          if (worker_threads_1.parentPort)
            worker_threads_1.parentPort.on("message", function (message) {
              if (message === "cancel") isJobHandlerCancelled = true;
            });
          secondsChunk = 10;
          lastEmptyInProgressMessageDateTime = date_fns_1.minTime;
          _loop_1 = function () {
            var jobService_1,
              jobCloudFormationCreateService_1,
              jobCloudFormationDeleteService_1,
              jobCopyOutService_1,
              jobs,
              jobPromises,
              _loop_2,
              _i,
              jobs_1,
              j,
              jobResults,
              e_1;
            return __generator(this, function (_c) {
              switch (_c.label) {
                case 0:
                  _c.trys.push([0, 6, , 8]);
                  jobService_1 = dc.resolve(job_service_1.JobService);
                  jobCloudFormationCreateService_1 = dc.resolve(
                    job_cloud_formation_create_service_1.JobCloudFormationCreateService,
                  );
                  jobCloudFormationDeleteService_1 = dc.resolve(
                    job_cloud_formation_delete_service_1.JobCloudFormationDeleteService,
                  );
                  jobCopyOutService_1 = dc.resolve(
                    job_copy_out_service_1.JobCopyOutService,
                  );
                  return [4 /*yield*/, jobService_1.getInProgressJobs()];
                case 1:
                  jobs = _c.sent();
                  if (!(!jobs || jobs.length < 1)) return [3 /*break*/, 2];
                  if (
                    (0, date_fns_1.differenceInHours)(
                      Date.now(),
                      lastEmptyInProgressMessageDateTime,
                    ) > 0
                  ) {
                    logger.debug(
                      "Check for in progress jobs resulted in empty set (this message occurs hourly even though checks are more frequent)",
                    );
                    lastEmptyInProgressMessageDateTime = Date.now();
                  }
                  return [3 /*break*/, 4];
                case 2:
                  // we always want to log this if we have actual jobs in progress
                  logger.debug(
                    "Check for in progress jobs resulted in set ".concat(jobs),
                  );
                  jobPromises = [];
                  // at least one job needs to 'take time' or else we could busy wait if an active job is just polling
                  jobPromises.push(sleep(secondsChunk * 1000));
                  _loop_2 = function (j) {
                    logger.debug("JOB");
                    logger.debug(j);
                    if (j.requestedCancellation) {
                      logger.info(
                        "Cancelling job "
                          .concat(j.jobType, " with id ")
                          .concat(j.jobId, " for release ")
                          .concat(j.releaseKey),
                      );
                    } else {
                      logger.info(
                        "Progressing job "
                          .concat(j.jobType, " with id ")
                          .concat(j.jobId, " for release ")
                          .concat(j.releaseKey),
                      );
                    }
                    // there is probably a nice OO pattern that could come out of these (quite) similar
                    // job calls - but for the moment we leave the flexibility to structure each job
                    // independently
                    switch (j.jobType) {
                      case "SelectJob":
                        if (j.requestedCancellation)
                          jobPromises.push(
                            jobService_1.endSelectJob(j.jobId, false, true),
                          );
                        else
                          jobPromises.push(
                            jobService_1
                              .doSelectJobWork(j.jobId, secondsChunk)
                              .then(function (result) {
                                if (result === 0)
                                  return jobService_1.endSelectJob(
                                    j.jobId,
                                    true,
                                    false,
                                  );
                              }),
                          );
                        break;
                      case "CloudFormationInstallJob":
                        jobPromises.push(
                          jobCloudFormationCreateService_1
                            .doCloudFormationInstallJob(j.jobId)
                            .then(function (result) {
                              if (result === 0)
                                return jobCloudFormationCreateService_1.endCloudFormationInstallJob(
                                  j.jobId,
                                  true,
                                  false,
                                );
                            }),
                        );
                        break;
                      case "CloudFormationDeleteJob":
                        jobPromises.push(
                          jobCloudFormationDeleteService_1
                            .doCloudFormationDeleteJob(j.jobId)
                            .then(function (result) {
                              if (result === 0)
                                return jobCloudFormationDeleteService_1.endCloudFormationDeleteJob(
                                  j.jobId,
                                  true,
                                );
                            }),
                        );
                        break;
                      case "CopyOutJob":
                        jobPromises.push(
                          jobCopyOutService_1
                            .progressCopyOutJob(j.jobId)
                            .then(function (result) {
                              if (result === 0)
                                return jobCopyOutService_1.endCopyOutJob(
                                  j.jobId,
                                  true,
                                );
                            }),
                        );
                        break;
                      default:
                        logger.error("Unknown job type ".concat(j.jobType));
                    }
                  };
                  for (_i = 0, jobs_1 = jobs; _i < jobs_1.length; _i++) {
                    j = jobs_1[_i];
                    _loop_2(j);
                  }
                  return [4 /*yield*/, Promise.all(jobPromises)];
                case 3:
                  jobResults = _c.sent();
                  _c.label = 4;
                case 4:
                  return [4 /*yield*/, sleep(secondsChunk * 1000)];
                case 5:
                  _c.sent();
                  logger.flush();
                  // the only way we finish the job service is if the parent asks us
                  if (isJobHandlerCancelled) {
                    logger.warn(
                      "JOB SERVICE FAILURE - RECEIVED PARENT CANCELLATION MESSAGE",
                    );
                    process.exit(0);
                  }
                  return [3 /*break*/, 8];
                case 6:
                  e_1 = _c.sent();
                  // TODO replace with a better failure mechanism
                  // if we hit 1000 failures then chances are we *are* just looping with failure and we probably do want to exit
                  if (failureCount++ > 1000) {
                    logger.fatal(
                      e_1,
                      "JOB SERVICE FAILURE - HIT FAILURE COUNT OF 1000 SO EXITING",
                    );
                    logger.flush();
                    process.exit(0);
                  } else {
                    logger.error(e_1, "JOB SERVICE FAILURE - RESTARTING");
                  }
                  // make sure if we are looping that we aren't consuming *all* the CPU
                  return [4 /*yield*/, sleep(60 * 1000)];
                case 7:
                  // make sure if we are looping that we aren't consuming *all* the CPU
                  _c.sent();
                  return [3 /*break*/, 8];
                case 8:
                  return [2 /*return*/];
              }
            });
          };
          _b.label = 5;
        case 5:
          if (!true) return [3 /*break*/, 7];
          return [5 /*yield**/, _loop_1()];
        case 6:
          _b.sent();
          return [3 /*break*/, 5];
        case 7:
          return [2 /*return*/];
      }
    });
  });
})();
