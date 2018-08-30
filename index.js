/**
 * Copyright 2016, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// [START functions_sendgrid_setup]
const sendgrid = require('sendgrid');
// [END functions_sendgrid_setup]

// [START functions_sendgrid_get_client]
/**
 * Returns a configured SendGrid client.
 *
 * @param {string} key Your SendGrid API key.
 * @returns {object} SendGrid client.
 */
function getClient (key) {
  if (!key) {
    const error = new Error('SendGrid API key not provided. Make sure you have a "sg_key" property in your request querystring');
    error.code = 401;
    throw error;
  }

  // Using SendGrid's Node.js Library https://github.com/sendgrid/sendgrid-nodejs
  return sendgrid(key);
}
// [END functions_sendgrid_get_client]

// [START functions_get_payload]
/**
 * Constructs the SendGrid email request from the HTTP request body.
 *
 * @param {object} requestBody Cloud Function request body.
 * @param {string} data.to Email address of the recipient.
 * @param {string} data.from Email address of the sender.
 * @param {string} data.subject Email subject line.
 * @param {string} data.body Body of the email subject line.
 * @returns {object} Payload object.
 */
function getPayload (requestBody) {
  if (!requestBody.to) {
    const error = new Error('To email address not provided. Make sure you have a "to" property in your request');
    error.code = 400;
    throw error;
  } else if (!requestBody.from) {
    const error = new Error('From email address not provided. Make sure you have a "from" property in your request');
    error.code = 400;
    throw error;
  } else if (!requestBody.subject) {
    const error = new Error('Email subject line not provided. Make sure you have a "subject" property in your request');
    error.code = 400;
    throw error;
  } else if (!requestBody.body) {
    const error = new Error('Email content not provided. Make sure you have a "body" property in your request');
    error.code = 400;
    throw error;
  }

  return {
    personalizations: [
      {
        to: [
          {
            email: requestBody.to
          }
        ],
        subject: requestBody.subject
      }
    ],
    from: {
      email: requestBody.from
    },
    content: [
      {
        type: 'text/plain',
        value: requestBody.body
      }
    ]
  };
}
// [END functions_get_payload]

// [START functions_sendgrid_email]
/**
 * Send an email using SendGrid.
 *
 * Trigger this function by making a POST request with a payload to:
 * https://[YOUR_REGION].[YOUR_PROJECT_ID].cloudfunctions.net/sendEmail?sg_key=[YOUR_API_KEY]
 *
 * @example
 * curl -X POST "https://us-central1.your-project-id.cloudfunctions.net/sendEmail?sg_key=your_api_key" --data '{"to":"bob@email.com","from":"alice@email.com","subject":"Hello from Sendgrid!","body":"Hello World!"}' --header "Content-Type: application/json"
 *
 * @param {object} req Cloud Function request context.
 * @param {object} req.query The parsed querystring.
 * @param {string} req.query.sg_key Your SendGrid API key.
 * @param {object} req.body The request payload.
 * @param {string} req.body.to Email address of the recipient.
 * @param {string} req.body.from Email address of the sender.
 * @param {string} req.body.subject Email subject line.
 * @param {string} req.body.body Body of the email subject line.
 * @param {object} res Cloud Function response context.
 */
exports.sendgridEmail = (req, res) => {
  return Promise.resolve()
    .then(() => {
      if (req.method !== 'POST') {
        const error = new Error('Only POST requests are accepted');
        error.code = 405;
        throw error;
      }

      // Get a SendGrid client
      const client = getClient(req.query.sg_key);

      // Build the SendGrid request to send email
      const request = client.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: getPayload(req.body)
      });

      // Make the request to SendGrid's API
      console.log(`Sending email to: ${req.body.to}`);
      return client.API(request);
    })
    .then((response) => {
      if (response.statusCode < 200 || response.statusCode >= 400) {
        const error = Error(response.body);
        error.code = response.statusCode;
        throw error;
      }

      console.log(`Email sent to: ${req.body.to}`);

      // Forward the response back to the requester
      res.status(response.statusCode);
      if (response.headers['content-type']) {
        res.set('content-type', response.headers['content-type']);
      }
      if (response.headers['content-length']) {
        res.set('content-length', response.headers['content-length']);
      }
      if (response.body) {
        res.send(response.body);
      } else {
        res.end();
      }
    })
    .catch((err) => {
      console.error(err);
      const code = err.code || (err.response ? err.response.statusCode : 500) || 500;
      res.status(code).send(err);
      return Promise.reject(err);
    });
};
// [END functions_sendgrid_email]
