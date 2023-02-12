/**
 * Release Report
 *
 * Generate a release message in PRs reporting the success of a new build
 * along with some quality of life links.
 */
module.exports = ({ context }) => {
  const prLinks = getContainerPRLinks(context);
  const hashLinks = getContainerHashLinks(context);
  return `

Docker build preview for waveshq/bridge/apps is ready!
          
Built with commit ${context.sha}

 - ${prLinks.join("\n - ")}

You can also get an immutable image with the commit hash

 - ${hashLinks.join("\n - ")}
`;
};

function getContainerPRLinks({ payload: { number } }) {
  return `ghcr.io/waveshq/bridge-api:pr-${number}`;
}

function getContainerHashLinks({ sha }) {
  return `ghcr.io/waveshq/bridge-api:${sha}`;
}
