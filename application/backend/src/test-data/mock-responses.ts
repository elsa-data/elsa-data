export const remsApplicationsResponse = [
  {
    "application/workflow": {
      "workflow/id": 1,
      "workflow/type": "workflow/default",
      "workflow.dynamic/handlers": [
        {
          userid: "auth0|62412e5cfec0a2006fa9cfaa",
          name: "REMS Admin",
          email: "rems+admin@umccr.org",
          "handler/active?": true,
          nickname: "rems+admin",
          picture:
            "https://s.gravatar.com/avatar/c368c4caf46000e574c250e2fc1172e7?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fre.png",
        },
      ],
    },
    "application/external-id": "2022/5",
    "application/first-submitted": "2022-05-19T06:23:48.756Z",
    "application/blacklist": [],
    "application/id": 5,
    "application/duo": {
      "duo/codes": [
        {
          id: "DUO:0000007",
          restrictions: [
            {
              type: "mondo",
              values: [
                {
                  id: "MONDO:0000437",
                  label: "cerebellar ataxia",
                },
              ],
            },
          ],
          shorthand: "DS",
          label: {
            en: "disease specific research",
          },
          description: {
            en: "This data use permission indicates that use is allowed provided it is related to the specified disease.",
          },
        },
      ],
      "duo/matches": [],
    },
    "application/applicant": {
      userid: "auth0|62412e5cfec0a2006fa9cfaa",
      name: "REMS Admin",
      email: "rems+admin@umccr.org",
      nickname: "rems+admin",
      picture:
        "https://s.gravatar.com/avatar/c368c4caf46000e574c250e2fc1172e7?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fre.png",
    },
    "application/todo": null,
    "application/members": [],
    "application/resources": [
      {
        "catalogue-item/end": null,
        "catalogue-item/expired": false,
        "catalogue-item/enabled": true,
        "resource/id": 3,
        "catalogue-item/title": {
          en: "Bowel Cancer Dataset 2022",
        },
        "catalogue-item/infourl": {},
        "resource/ext-id": "http://cci.org.au/datasets/BOWEL",
        "catalogue-item/start": "2022-05-19T06:22:20.709Z",
        "catalogue-item/archived": false,
        "catalogue-item/id": 3,
      },
    ],
    "application/deadline": "2022-05-23T06:23:48.756Z",
    "application/accepted-licenses": {
      "auth0|62412e5cfec0a2006fa9cfaa": [1],
    },
    "application/invited-members": [],
    "application/description": "",
    "application/generated-external-id": "2022/5",
    "application/permissions": [
      "application.command/copy-as-new",
      "application.command/invite-member",
      "see-everything",
      "application.command/remove-member",
      "application.command/revoke",
      "application.command/accept-licenses",
      "application.command/uninvite-member",
      "application.command/remark",
      "application.command/add-member",
      "application.command/close",
      "application.command/change-resources",
    ],
    "application/last-activity": "2022-05-19T06:24:41.285Z",
    "application/roles": ["applicant", "handler"],
    "application/attachments": [
      {
        "attachment/id": 1,
        "attachment/filename":
          "280505472_2253912114787458_8118172808640493719_n.jpg",
        "attachment/type": "image/jpeg",
      },
    ],
    "application/created": "2022-05-19T06:22:49.665Z",
    "application/state": "application.state/approved",
    "application/modified": "2022-05-19T06:23:48.694Z",
  },
];
