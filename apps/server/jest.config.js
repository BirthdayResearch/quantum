module.exports = {
  preset: '@birthdayresearch/sticky-turbo-jest',
  testSequencer: require.resolve('./jest.sequencer'),
  projects: [
    {
      displayName: 'test:i9n',
      preset: '@birthdayresearch/sticky-turbo-jest',
      testRegex: '.*\\.i9n\\.ts$',
    },
  ],
};
