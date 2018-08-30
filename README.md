<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# Google Cloud Function

### Send email from Send Grid

Fork from:

https://github.com/GoogleCloudPlatform/nodejs-docs-samples/tree/master/functions/sendgrid

### Deploy

        gcloud functions deploy sendgridEmail --trigger-http

### Query

        curl -X POST "https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/sendgridEmail?sg_key=send_grid_api_key" --data '{"to":"email_dest","from":"email_from","subject":"yoursubject","body":"yourbody"}' --header "Content-Type: application/json"


## Run the tests

1. Install dependencies:

        npm install

1. Run the tests:

        npm test
