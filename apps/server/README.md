### Local setup

Run these commands in the root directory of the server package. This will spin up a local instance of the app server.

```shell
# Install dependencies and build the project for workspace dependencies
$ pnpm install && pnpm build

# Run the necessary containers that the server relies on
# Give this command a little bit of time to start up the containers
$ pnpm playground:start

# Run the server itself, after running the necessary migrations
$ pnpm dev
```
