module.exports = function (shipit) {
  require('shipit-deploy')(shipit);

  shipit.initConfig({
    default: {
      workspace: '/tmp/github-monitor',
      deployTo: '~/code/prod/avail',
      repositoryUrl: 'https://github.com/availabs/avail.git',
      ignores: ['.git', 'node_modules'],
      keepReleases: 2,
      key: '~/.ssh/id_rsa',
      shallowClone: true
    },
    staging: {
      servers: 'avail@lor.availabs.org'
    }
  });
};