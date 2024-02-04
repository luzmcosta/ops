# ops

OpsJS is a script meant to be run inside a dev container.

The script uses prompts to guide the developer through the
interactive steps of authorizing Google Cloud, Firebase and
Font Awesome in a container.

## Configure

Create a `.env` file from the `.env.example` file provided.
Update values if needed.

Review the `.firebaserc` file to confirm it contains the
values desired.

## Install

Install the ops CLI globally to expose the command to the
system.

```shell
npm run start
```

## Run

Run the command that guides the developer through the
interactive setup process.

```shell
ops setup
```

### Example Output

Running the `ops setup` command produces output similar to
the following block. Secrets and interactive text have been
redacted for security and brevity.

```text
Setting up the environment ...
Configuring the NODE_ENV environment variable to development ...
NODE_ENV is set to development.
The environment is ready.

Configuring Google Cloud ...
Running `gcloud config set project PROJECT_NAME --no-user-output-enabled` ...
Google Cloud is ready.

Enabling Firebase's experimental webframeworks feature ...
Running `firebase experiments:enable webframeworks` ...
Enabled experiment webframeworks

Signing into Firebase ...

# [PROMPT] User walks through `firebase login`.

✔  Success! Logged in as YOUR_EMAIL

Running `firebase use default` ...
Firebase is ready.

Setting up Font Awesome ...

# [PROMPT] User enters their Font Awesome token.

Configuring access to the Font Awesome registry ...
Running `npm config set "@fortawesome:registry" npm.fontawesome.com/` ...
Running `npm config set "//npm.fontawesome.com/:_authToken" SECRET` ...
Font Awesome is ready.

The setup is complete. Happy coding!
```
