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
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
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
var bootstrap_dependency_injection_1 = require("../src/bootstrap-dependency-injection");
var node_worker_threads_1 = require("node:worker_threads");
var bootstrap_settings_1 = require("../src/bootstrap-settings");
var config_load_1 = require("../src/config/config-load");
var pino_1 = require("pino");
var edgeql_js_1 = require("../dbschema/edgeql-js");
var features_1 = require("../src/features");
var release_data_egress_service_1 = require("../src/business/services/releases/release-data-egress-service");
var audit_event_service_1 = require("../src/business/services/audit-event-service");
var aws_cloudtrail_lake_service_1 = require("../src/business/services/aws/aws-cloudtrail-lake-service");
var release_data_egress_helper_1 = require("../src/business/services/releases/helpers/release-data-egress-helper");
var ip_lookup_service_1 = require("../src/business/services/ip-lookup-service");
(function () {
  return __awaiter(void 0, void 0, void 0, function () {
    var rawConfig,
      settings,
      logger,
      dc,
      features,
      edgeDbClient,
      auditEventService,
      awsCloudTrailLakeService,
      ipLookupService,
      releaseDataEgressService,
      releasesDetails,
      _loop_1,
      _i,
      releasesDetails_1,
      rd;
    var _a;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
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
          edgeDbClient = dc.resolve("Database");
          auditEventService = dc.resolve(
            audit_event_service_1.AuditEventService,
          );
          awsCloudTrailLakeService = dc.resolve(
            aws_cloudtrail_lake_service_1.AwsCloudTrailLakeService,
          );
          ipLookupService = dc.resolve(ip_lookup_service_1.IPLookupService);
          releaseDataEgressService = dc.resolve(
            release_data_egress_service_1.ReleaseDataEgressService,
          );
          return [
            4 /*yield*/,
            edgeql_js_1.default
              .select(edgeql_js_1.default.release.Release, function (r) {
                return {
                  releaseKey: true,
                  datasetUris: true,
                };
              })
              .run(edgeDbClient),
          ];
        case 5:
          releasesDetails = _b.sent();
          _loop_1 = function (rd) {
            return __generator(this, function (_c) {
              switch (_c.label) {
                case 0:
                  return [
                    4 /*yield*/,
                    auditEventService.systemAuditEventPattern(
                      "update egress record periodically",
                      function (completeAuditFn) {
                        return __awaiter(void 0, void 0, void 0, function () {
                          return __generator(this, function (_a) {
                            edgeDbClient.transaction(function (tx) {
                              return __awaiter(
                                void 0,
                                void 0,
                                void 0,
                                function () {
                                  return __generator(this, function (_a) {
                                    switch (_a.label) {
                                      case 0:
                                        return [
                                          4 /*yield*/,
                                          (0,
                                          release_data_egress_helper_1.updateDataEgressRecordByReleaseKey)(
                                            {
                                              tx: tx,
                                              dataEgressQueryService:
                                                awsCloudTrailLakeService,
                                              ipLookupService: ipLookupService,
                                              releaseKey: rd.releaseKey,
                                            },
                                          ),
                                        ];
                                      case 1:
                                        return [2 /*return*/, _a.sent()];
                                    }
                                  });
                                },
                              );
                            });
                            return [2 /*return*/];
                          });
                        });
                      },
                    ),
                  ];
                case 1:
                  _c.sent();
                  return [2 /*return*/];
              }
            });
          };
          (_i = 0), (releasesDetails_1 = releasesDetails);
          _b.label = 6;
        case 6:
          if (!(_i < releasesDetails_1.length)) return [3 /*break*/, 9];
          rd = releasesDetails_1[_i];
          return [5 /*yield**/, _loop_1(rd)];
        case 7:
          _b.sent();
          _b.label = 8;
        case 8:
          _i++;
          return [3 /*break*/, 6];
        case 9:
          return [2 /*return*/];
      }
    });
  });
})();
